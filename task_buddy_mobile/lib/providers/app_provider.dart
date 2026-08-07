import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/todo_models.dart';
import '../services/local_notification_service.dart';

enum ViewMode { today, upcoming, list }

class AppProvider extends ChangeNotifier {
  final _supabase = Supabase.instance.client;

  List<TodoList> _lists = [];
  List<TodoTask> _tasks = [];
  String? _activeListId;
  ViewMode _activeView = ViewMode.today;
  bool _isLoading = false;
  bool _notificationsEnabled = true;
  StreamSubscription? _tasksSubscription;
  StreamSubscription? _listsSubscription;

  AppProvider() {
    // 1. Instant Cache Load from Disk (0ms Latency)
    _loadFromCache().then((_) {
      // 2. Fetch fresh data from Supabase in background
      fetchData();
    });
  }

  List<TodoList> get lists => _lists;
  List<TodoTask> get tasks => _tasks;
  String? get activeListId => _activeListId;
  ViewMode get activeView => _activeView;
  bool get isLoading => _isLoading;
  bool get notificationsEnabled => _notificationsEnabled;
  User? get currentUser => _supabase.auth.currentUser;

  TodoList? get activeList {
    if (_activeListId == null) return null;
    try {
      return _lists.firstWhere((l) => l.id == _activeListId);
    } catch (_) {
      return null;
    }
  }

  // Instant Local Disk Cache Persistence (0ms App Startup)
  Future<void> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final listsJson = prefs.getString('cached_lists');
      final tasksJson = prefs.getString('cached_tasks');

      if (listsJson != null) {
        final List decoded = jsonDecode(listsJson);
        _lists = decoded.map((e) => TodoList.fromJson(e)).toList();
      }
      if (tasksJson != null) {
        final List decoded = jsonDecode(tasksJson);
        _tasks = decoded.map((e) => TodoTask.fromJson(e)).toList();
      }
      if (_lists.isNotEmpty && _activeListId == null) {
        _activeListId = _lists.first.id;
      }
      notifyListeners();
    } catch (e) {
      print('Cache read error: $e');
    }
  }

  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final listsJson = jsonEncode(_lists.map((l) => l.toJson()).toList());
      final tasksJson = jsonEncode(_tasks.map((t) => t.toJson()).toList());
      await prefs.setString('cached_lists', listsJson);
      await prefs.setString('cached_tasks', tasksJson);
    } catch (e) {
      print('Cache write error: $e');
    }
  }

  // Get current view tasks sorted in ASCENDING order by due_date / created_at
  List<TodoTask> get currentViewTasks {
    List<TodoTask> filtered = [];
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);

    if (_activeView == ViewMode.today) {
      filtered = _tasks.where((t) {
        if (t.dueDate == null) return true;
        return t.dueDate!.isAfter(todayStart.subtract(const Duration(seconds: 1))) &&
               t.dueDate!.isBefore(todayEnd.add(const Duration(seconds: 1)));
      }).toList();
    } else if (_activeView == ViewMode.upcoming) {
      filtered = _tasks.where((t) {
        if (t.dueDate == null) return false;
        return t.dueDate!.isAfter(todayEnd);
      }).toList();
    } else if (_activeView == ViewMode.list && _activeListId != null) {
      filtered = _tasks.where((t) => t.listId == _activeListId).toList();
    }

    // Sort Ascending by due_date or created_at
    filtered.sort((a, b) {
      if (a.dueDate != null && b.dueDate != null) {
        return a.dueDate!.compareTo(b.dueDate!);
      } else if (a.dueDate != null) {
        return -1;
      } else if (b.dueDate != null) {
        return 1;
      } else {
        return a.createdAt.compareTo(b.createdAt);
      }
    });

    return filtered;
  }

  Future<void> fetchData() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    try {
      final listsResponse = await _supabase
          .from('lists')
          .select()
          .eq('user_id', user.id)
          .order('created_at', ascending: true);

      final tasksResponse = await _supabase
          .from('tasks')
          .select()
          .eq('user_id', user.id)
          .order('position', ascending: true);

      _lists = (listsResponse as List).map((item) => TodoList.fromJson(item)).toList();
      _tasks = (tasksResponse as List).map((item) => TodoTask.fromJson(item)).toList();

      if (_lists.isNotEmpty && _activeListId == null) {
        _activeListId = _lists.first.id;
      }

      // Persist to disk cache
      _saveToCache();

      // Start periodic deadline notification checks (every 60s)
      if (_notificationsEnabled) {
        LocalNotificationService.startPeriodicChecks(() => _tasks);
      }

      // Setup real-time listener for instant zero-lag updates
      _setupRealtimeListeners(user.id);
    } catch (e) {
      print('Error fetching Supabase data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _setupRealtimeListeners(String userId) {
    _tasksSubscription?.cancel();
    _listsSubscription?.cancel();

    try {
      // Listen for instant WebSocket Supabase changes on tasks with error safety
      _tasksSubscription = _supabase
          .from('tasks')
          .stream(primaryKey: ['id'])
          .eq('user_id', userId)
          .listen(
            (data) {
              _tasks = data.map((item) => TodoTask.fromJson(item)).toList();
              _saveToCache();
              notifyListeners();
            },
            onError: (error) {
              print('Realtime tasks stream error (falling back to REST sync): $error');
            },
          );

      // Listen for instant WebSocket Supabase changes on lists with error safety
      _listsSubscription = _supabase
          .from('lists')
          .stream(primaryKey: ['id'])
          .eq('user_id', userId)
          .listen(
            (data) {
              _lists = data.map((item) => TodoList.fromJson(item)).toList();
              _saveToCache();
              notifyListeners();
            },
            onError: (error) {
              print('Realtime lists stream error (falling back to REST sync): $error');
            },
          );
    } catch (e) {
      print('Realtime setup error: $e');
    }
  }

  void toggleNotifications(bool enabled) {
    _notificationsEnabled = enabled;
    if (enabled) {
      LocalNotificationService.startPeriodicChecks(() => _tasks);
    } else {
      LocalNotificationService.stopPeriodicChecks();
    }
    notifyListeners();
  }

  Future<void> updatePassword(String newPassword) async {
    await _supabase.auth.updateUser(UserAttributes(password: newPassword));
  }

  void setActiveView(ViewMode mode) {
    _activeView = mode;
    notifyListeners();
  }

  void setActiveList(String listId) {
    _activeListId = listId;
    _activeView = ViewMode.list;
    notifyListeners();
  }

  Future<void> toggleTaskCompletion(TodoTask task) async {
    final updatedTask = task.copyWith(isCompleted: !task.isCompleted);
    final index = _tasks.indexWhere((t) => t.id == task.id);
    if (index != -1) {
      _tasks[index] = updatedTask;
      _saveToCache();
      notifyListeners();
    }

    try {
      await _supabase.from('tasks').update({
        'is_completed': updatedTask.isCompleted,
      }).eq('id', task.id);
    } catch (e) {
      print('Error updating task status: $e');
    }
  }

  Future<void> addTask({
    required String title,
    String? description,
    String priority = 'medium',
    DateTime? dueDate,
  }) async {
    final user = _supabase.auth.currentUser;
    final targetListId = _activeListId ?? (_lists.isNotEmpty ? _lists.first.id : 'default');

    final newTask = TodoTask(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      listId: targetListId,
      title: title,
      description: description,
      priority: priority,
      dueDate: dueDate,
      createdAt: DateTime.now(),
      userId: user?.id,
    );

    _tasks.add(newTask);
    _saveToCache();
    notifyListeners();

    if (_notificationsEnabled) {
      LocalNotificationService.show(
        id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title: 'Task Created: $title',
        body: priority == 'high' ? 'High priority task added!' : 'Task added to your list.',
      );
    }

    try {
      if (user != null) {
        final inserted = await _supabase.from('tasks').insert(newTask.toInsertJson()).select().single();
        final realTask = TodoTask.fromJson(inserted);
        final idx = _tasks.indexWhere((t) => t.id == newTask.id);
        if (idx != -1) {
          _tasks[idx] = realTask;
          _saveToCache();
          notifyListeners();
        }
      }
    } catch (e) {
      print('Error adding task to Supabase: $e');
    }
  }

  Future<void> addList(String title, {String? description, String? color}) async {
    final user = _supabase.auth.currentUser;
    final newList = TodoList(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      description: description,
      color: color ?? '#6C63FF',
      createdAt: DateTime.now(),
      userId: user?.id,
    );

    _lists.add(newList);
    _activeListId = newList.id;
    _activeView = ViewMode.list;
    _saveToCache();
    notifyListeners();

    try {
      if (user != null) {
        final inserted = await _supabase.from('lists').insert(newList.toInsertJson()).select().single();
        final realList = TodoList.fromJson(inserted);
        final idx = _lists.indexWhere((l) => l.id == newList.id);
        if (idx != -1) {
          _lists[idx] = realList;
          _activeListId = realList.id;
          _saveToCache();
          notifyListeners();
        }
      }
    } catch (e) {
      print('Error adding list to Supabase: $e');
    }
  }

  Future<void> deleteList(String listId) async {
    _lists.removeWhere((l) => l.id == listId);
    _tasks.removeWhere((t) => t.listId == listId);

    if (_activeListId == listId) {
      _activeListId = _lists.isNotEmpty ? _lists.first.id : null;
      _activeView = _activeListId != null ? ViewMode.list : ViewMode.today;
    }
    _saveToCache();
    notifyListeners();

    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        await _supabase.from('lists').delete().eq('id', listId);
      }
    } catch (e) {
      print('Error deleting list from Supabase: $e');
    }
  }

  Future<void> deleteTask(String taskId) async {
    _tasks.removeWhere((t) => t.id == taskId);
    _saveToCache();
    notifyListeners();

    try {
      final user = _supabase.auth.currentUser;
      if (user != null) {
        await _supabase.from('tasks').delete().eq('id', taskId);
      }
    } catch (e) {
      print('Error deleting task from Supabase: $e');
    }
  }

  @override
  void dispose() {
    _tasksSubscription?.cancel();
    _listsSubscription?.cancel();
    LocalNotificationService.stopPeriodicChecks();
    super.dispose();
  }
}

import 'dart:async';
import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/todo_models.dart';

/// Standalone local notification service for task deadline reminders.
/// Works entirely offline — no Firebase/FCM required.
/// Checks tasks every 60 seconds and fires local notifications for:
///   - Tasks due within 1 hour (urgent reminder)
///   - Tasks due within 2-4 hours (early warning)
///   - Overdue tasks (within last 4 hours)
///   - Daily morning digest on first app open each day
class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'task_buddy_deadlines',
    'Task Deadline Reminders',
    description: 'Notifications for upcoming and overdue task deadlines',
    importance: Importance.high,
  );

  static Timer? _periodicTimer;

  /// Initialize the local notification plugin and create the Android channel.
  static Future<void> initialize() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(initSettings);

    // Create the notification channel on Android
    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // Request permission on Android 13+
    if (Platform.isAndroid) {
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
    }
  }

  /// Show a local notification immediately.
  static Future<void> show({
    required int id,
    required String title,
    required String body,
  }) async {
    await _plugin.show(
      id,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          icon: '@mipmap/ic_launcher',
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
    );
  }

  /// Start a 60-second periodic timer that checks task deadlines.
  static void startPeriodicChecks(List<TodoTask> Function() tasksProvider) {
    _periodicTimer?.cancel();

    // Run immediately on start
    _checkDeadlinesAndNotify(tasksProvider());

    // Then run every 60 seconds
    _periodicTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      _checkDeadlinesAndNotify(tasksProvider());
    });
  }

  /// Stop the periodic deadline checker.
  static void stopPeriodicChecks() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

  /// Core deadline checking logic — mirrors the web app's notification system.
  static Future<void> _checkDeadlinesAndNotify(List<TodoTask> tasks) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Show daily digest on first check each day
      _showDailyDigest(tasks, prefs);

      // 2. Check individual task deadlines
      final now = DateTime.now();
      final notifiedJson = prefs.getString('notified_tasks') ?? '{}';
      final Map<String, int> notifiedTasks = {};
      
      // Parse the stored notification timestamps
      try {
        final decoded = Uri.splitQueryString(notifiedJson.replaceAll('{', '').replaceAll('}', ''));
        for (final entry in decoded.entries) {
          final val = int.tryParse(entry.value);
          if (val != null) notifiedTasks[entry.key] = val;
        }
      } catch (_) {}

      // Use a simpler storage format
      final storedMap = prefs.getStringList('notified_task_keys') ?? [];
      final storedTimes = prefs.getStringList('notified_task_times') ?? [];
      final Map<String, int> notified = {};
      for (int i = 0; i < storedMap.length && i < storedTimes.length; i++) {
        final t = int.tryParse(storedTimes[i]);
        if (t != null) notified[storedMap[i]] = t;
      }

      // Clean up old entries (older than 48 hours)
      final twoDaysMs = 48 * 60 * 60 * 1000;
      notified.removeWhere((_, timestamp) =>
          DateTime.now().millisecondsSinceEpoch - timestamp > twoDaysMs);

      for (final task in tasks) {
        if (task.isCompleted || task.dueDate == null) continue;

        final timeDiffMs = task.dueDate!.millisecondsSinceEpoch - now.millisecondsSinceEpoch;
        final minutesDiff = timeDiffMs / (1000 * 60);
        final hoursDiff = minutesDiff / 60;

        // Due within 1 hour — urgent reminder
        if (minutesDiff > 0 && minutesDiff <= 60) {
          final key = 'upcoming-${task.id}';
          final last = notified[key];
          final thirtyMinMs = 30 * 60 * 1000;

          if (last == null || now.millisecondsSinceEpoch - last > thirtyMinMs) {
            final timeStr = '${task.dueDate!.hour.toString().padLeft(2, '0')}:${task.dueDate!.minute.toString().padLeft(2, '0')}';
            
            if (minutesDiff <= 15) {
              await show(
                id: task.id.hashCode,
                title: '🔴 Task Due Very Soon!',
                body: '"${task.title}" is due at $timeStr — only ${minutesDiff.ceil()} minutes left!',
              );
            } else {
              await show(
                id: task.id.hashCode,
                title: '⏰ Upcoming Task Reminder',
                body: '"${task.title}" is due at $timeStr (in ${minutesDiff.ceil()} minutes)',
              );
            }
            notified[key] = now.millisecondsSinceEpoch;
          }
        }

        // Due within 2-4 hours — early warning (once only)
        if (hoursDiff > 1 && hoursDiff <= 4) {
          final key = 'early-${task.id}';
          if (!notified.containsKey(key)) {
            await show(
              id: task.id.hashCode + 1000,
              title: '📅 Task Due Today',
              body: '"${task.title}" is due in about ${hoursDiff.ceil()} hours. Plan ahead!',
            );
            notified[key] = now.millisecondsSinceEpoch;
          }
        }

        // Overdue (within last 4 hours)
        if (minutesDiff < 0 && minutesDiff.abs() <= 240) {
          final key = 'overdue-${task.id}';
          final last = notified[key];
          final twoHoursMs = 2 * 60 * 60 * 1000;

          if (last == null || now.millisecondsSinceEpoch - last > twoHoursMs) {
            final overdueMins = minutesDiff.abs().ceil();
            final overdueText = overdueMins >= 60
                ? '${overdueMins ~/ 60}h ${overdueMins % 60}m'
                : '$overdueMins minutes';

            await show(
              id: task.id.hashCode + 2000,
              title: '🚨 Overdue Task!',
              body: '"${task.title}" is overdue by $overdueText. Don\'t let it slip!',
            );
            notified[key] = now.millisecondsSinceEpoch;
          }
        }
      }

      // Save updated notification state
      await prefs.setStringList('notified_task_keys', notified.keys.toList());
      await prefs.setStringList(
          'notified_task_times', notified.values.map((v) => v.toString()).toList());
    } catch (e) {
      print('Deadline notification check error: $e');
    }
  }

  /// Show a daily morning digest notification (once per day).
  static Future<void> _showDailyDigest(
      List<TodoTask> tasks, SharedPreferences prefs) async {
    final todayKey =
        '${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().day.toString().padLeft(2, '0')}';
    final lastDigest = prefs.getString('last_daily_digest');

    if (lastDigest == todayKey) return;

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);
    final tomorrowStart = todayEnd.add(const Duration(seconds: 1));
    final tomorrowEnd = tomorrowStart.add(const Duration(hours: 23, minutes: 59, seconds: 59));

    final todayTasks = tasks.where((t) =>
        !t.isCompleted &&
        t.dueDate != null &&
        t.dueDate!.isAfter(todayStart.subtract(const Duration(seconds: 1))) &&
        t.dueDate!.isBefore(todayEnd.add(const Duration(seconds: 1)))).toList();

    final overdueTasks = tasks.where((t) =>
        !t.isCompleted &&
        t.dueDate != null &&
        t.dueDate!.isBefore(todayStart)).toList();

    final tomorrowTasks = tasks.where((t) =>
        !t.isCompleted &&
        t.dueDate != null &&
        t.dueDate!.isAfter(tomorrowStart.subtract(const Duration(seconds: 1))) &&
        t.dueDate!.isBefore(tomorrowEnd.add(const Duration(seconds: 1)))).toList();

    final pendingCount = tasks.where((t) => !t.isCompleted).length;

    final parts = <String>[];
    if (overdueTasks.isNotEmpty) {
      parts.add('🚨 ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}');
    }
    if (todayTasks.isNotEmpty) {
      final names = todayTasks.take(3).map((t) => '"${t.title}"').join(', ');
      final extra = todayTasks.length > 3 ? ' +${todayTasks.length - 3} more' : '';
      parts.add('📋 Today: $names$extra');
    } else {
      parts.add('✅ No tasks due today');
    }
    if (tomorrowTasks.isNotEmpty) {
      parts.add('📅 ${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? 's' : ''} due tomorrow');
    }
    if (pendingCount > 0) {
      parts.add('📝 $pendingCount total pending task${pendingCount > 1 ? 's' : ''}');
    }

    final hour = now.hour;
    String greeting = '📌 Good morning!';
    if (hour >= 12 && hour < 17) greeting = '📌 Good afternoon!';
    if (hour >= 17) greeting = '📌 Good evening!';

    await show(
      id: 999999,
      title: '$greeting Here\'s your daily plan',
      body: parts.join('\n'),
    );

    await prefs.setString('last_daily_digest', todayKey);
  }

  /// Send a test notification to verify the system is working.
  static Future<void> sendTestNotification() async {
    await show(
      id: 888888,
      title: '🔔 Task Buddy Notifications Active',
      body: 'You will receive reminders for upcoming and overdue task deadlines.',
    );
  }
}

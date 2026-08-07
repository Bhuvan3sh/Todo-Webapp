import 'dart:async';
import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../models/todo_models.dart';

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

  static Future<void> initialize() async {
    tz.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(initSettings);

    await _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    if (Platform.isAndroid) {
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestNotificationsPermission();
      
      await _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.requestExactAlarmsPermission();
    }
  }

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

  /// Schedule exact native OS AlarmManager notification even when app is killed
  static Future<void> scheduleTaskAlarm(TodoTask task) async {
    if (task.isCompleted || task.dueDate == null) return;
    if (task.dueDate!.isBefore(DateTime.now())) return;

    try {
      final scheduledDate = tz.TZDateTime.from(task.dueDate!, tz.local);
      final notificationId = task.id.hashCode.abs();

      // 1. Alarm at exact due date
      await _plugin.zonedSchedule(
        notificationId,
        '⏰ Task Due Now!',
        '"${task.title}" is due now!',
        scheduledDate,
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
          iOS: const DarwinNotificationDetails(presentAlert: true, presentSound: true),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );

      // 2. Early reminder 15 mins before due date
      final fifteenMinsBefore = scheduledDate.subtract(const Duration(minutes: 15));
      if (fifteenMinsBefore.isAfter(tz.TZDateTime.now(tz.local))) {
        await _plugin.zonedSchedule(
          notificationId + 5000,
          '🔴 Task Due in 15 Minutes!',
          '"${task.title}" is due soon!',
          fifteenMinsBefore,
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
            iOS: const DarwinNotificationDetails(presentAlert: true, presentSound: true),
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
        );
      }
    } catch (e) {
      print('Error scheduling exact alarm for task ${task.id}: $e');
    }
  }

  static void startPeriodicChecks(List<TodoTask> Function() tasksProvider) {
    _periodicTimer?.cancel();
    _syncAllTaskAlarms(tasksProvider());

    _periodicTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      final tasks = tasksProvider();
      _syncAllTaskAlarms(tasks);
      final prefs = await SharedPreferences.getInstance();
      await checkDeadlinesAndNotify(tasks, _plugin, prefs);
    });
  }

  static Future<void> _syncAllTaskAlarms(List<TodoTask> tasks) async {
    for (final task in tasks) {
      await scheduleTaskAlarm(task);
    }
  }

  static void stopPeriodicChecks() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

  static Future<void> checkDeadlinesAndNotify(
      List<TodoTask> tasks,
      FlutterLocalNotificationsPlugin plugin,
      SharedPreferences prefs) async {
    try {
      _showDailyDigest(tasks, plugin, prefs);

      final now = DateTime.now();
      final storedMap = prefs.getStringList('notified_task_keys') ?? [];
      final storedTimes = prefs.getStringList('notified_task_times') ?? [];
      final Map<String, int> notified = {};

      for (int i = 0; i < storedMap.length && i < storedTimes.length; i++) {
        final t = int.tryParse(storedTimes[i]);
        if (t != null) notified[storedMap[i]] = t;
      }

      final twoDaysMs = 48 * 60 * 60 * 1000;
      notified.removeWhere((_, timestamp) =>
          now.millisecondsSinceEpoch - timestamp > twoDaysMs);

      for (final task in tasks) {
        if (task.isCompleted || task.dueDate == null) continue;

        final timeDiffMs = task.dueDate!.millisecondsSinceEpoch - now.millisecondsSinceEpoch;
        final minutesDiff = timeDiffMs / (1000 * 60);

        if (minutesDiff > 0 && minutesDiff <= 60) {
          final key = 'upcoming-${task.id}';
          final last = notified[key];

          if (last == null || now.millisecondsSinceEpoch - last > 30 * 60 * 1000) {
            final timeStr =
                '${task.dueDate!.hour.toString().padLeft(2, '0')}:${task.dueDate!.minute.toString().padLeft(2, '0')}';
            
            await show(
              id: task.id.hashCode.abs(),
              title: minutesDiff <= 15 ? '🔴 Task Due Very Soon!' : '⏰ Upcoming Task Reminder',
              body: '"${task.title}" is due at $timeStr (${minutesDiff.ceil()}m left)',
            );
            notified[key] = now.millisecondsSinceEpoch;
          }
        }

        if (minutesDiff < 0 && minutesDiff.abs() <= 240) {
          final key = 'overdue-${task.id}';
          final last = notified[key];

          if (last == null || now.millisecondsSinceEpoch - last > 2 * 60 * 60 * 1000) {
            final overdueMins = minutesDiff.abs().ceil();
            final overdueText = overdueMins >= 60
                ? '${overdueMins ~/ 60}h ${overdueMins % 60}m'
                : '$overdueMins minutes';

            await show(
              id: task.id.hashCode.abs() + 2000,
              title: '🚨 Overdue Task!',
              body: '"${task.title}" is overdue by $overdueText. Don\'t let it slip!',
            );
            notified[key] = now.millisecondsSinceEpoch;
          }
        }
      }

      await prefs.setStringList('notified_task_keys', notified.keys.toList());
      await prefs.setStringList(
          'notified_task_times', notified.values.map((v) => v.toString()).toList());
    } catch (e) {
      print('Deadline notification check error: $e');
    }
  }

  static Future<void> _showDailyDigest(
      List<TodoTask> tasks,
      FlutterLocalNotificationsPlugin plugin,
      SharedPreferences prefs) async {
    final todayKey =
        '${DateTime.now().year}-${DateTime.now().month.toString().padLeft(2, '0')}-${DateTime.now().day.toString().padLeft(2, '0')}';
    final lastDigest = prefs.getString('last_daily_digest');

    if (lastDigest == todayKey) return;

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);

    final todayTasks = tasks.where((t) =>
        !t.isCompleted &&
        t.dueDate != null &&
        t.dueDate!.isAfter(todayStart.subtract(const Duration(seconds: 1))) &&
        t.dueDate!.isBefore(todayEnd.add(const Duration(seconds: 1)))).toList();

    final overdueTasks = tasks.where((t) =>
        !t.isCompleted &&
        t.dueDate != null &&
        t.dueDate!.isBefore(todayStart)).toList();

    final parts = <String>[];
    if (overdueTasks.isNotEmpty) {
      parts.add('🚨 ${overdueTasks.length} overdue task(s)');
    }
    if (todayTasks.isNotEmpty) {
      final names = todayTasks.take(3).map((t) => '"${t.title}"').join(', ');
      parts.add('📋 Today: $names');
    } else {
      parts.add('✅ No tasks due today');
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

  static Future<void> sendTestNotification() async {
    await show(
      id: 888888,
      title: '🔔 Task Buddy Background Notifications Active',
      body: 'Native Android AlarmManager exact scheduled notifications active!',
    );
  }
}

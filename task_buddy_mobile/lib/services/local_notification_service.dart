import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../models/todo_models.dart';

// ─── Top-level entry point for the background isolate ───────────────
@pragma('vm:entry-point')
Future<void> onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final plugin = FlutterLocalNotificationsPlugin();
  tz.initializeTimeZones();

  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosSettings = DarwinInitializationSettings();
  await plugin.initialize(
    const InitializationSettings(android: androidSettings, iOS: iosSettings),
  );

  // Create the notification channel in the background isolate too
  await plugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(const AndroidNotificationChannel(
        'task_buddy_deadlines',
        'Task Deadline Reminders',
        description: 'Notifications for upcoming and overdue task deadlines',
        importance: Importance.high,
      ));

  // Run deadline check every 60 seconds in the background
  Timer.periodic(const Duration(seconds: 60), (_) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.reload(); // Reload to get latest cached tasks
      final tasksJson = prefs.getString('cached_tasks');
      if (tasksJson != null) {
        final List decoded = jsonDecode(tasksJson);
        final tasks = decoded.map((e) => TodoTask.fromJson(e)).toList();
        await _bgCheckDeadlines(tasks, plugin, prefs);
      }
    } catch (e) {
      print('Background deadline check error: $e');
    }
  });

  // Handle stop
  service.on('stopService').listen((event) {
    service.stopSelf();
  });
}

// Deadline check logic for background isolate
Future<void> _bgCheckDeadlines(
    List<TodoTask> tasks,
    FlutterLocalNotificationsPlugin plugin,
    SharedPreferences prefs) async {
  final now = DateTime.now();
  final storedMap = prefs.getStringList('notified_task_keys') ?? [];
  final storedTimes = prefs.getStringList('notified_task_times') ?? [];
  final Map<String, int> notified = {};

  for (int i = 0; i < storedMap.length && i < storedTimes.length; i++) {
    final t = int.tryParse(storedTimes[i]);
    if (t != null) notified[storedMap[i]] = t;
  }

  // Clean up old entries (older than 48 hours)
  notified.removeWhere(
      (_, timestamp) => now.millisecondsSinceEpoch - timestamp > 48 * 60 * 60 * 1000);

  for (final task in tasks) {
    if (task.isCompleted || task.dueDate == null) continue;

    final timeDiffMs =
        task.dueDate!.millisecondsSinceEpoch - now.millisecondsSinceEpoch;
    final minutesDiff = timeDiffMs / (1000 * 60);

    // Due within 1 hour — urgent reminder
    if (minutesDiff > 0 && minutesDiff <= 60) {
      final key = 'upcoming-${task.id}';
      final last = notified[key];

      if (last == null || now.millisecondsSinceEpoch - last > 30 * 60 * 1000) {
        final timeStr =
            '${task.dueDate!.hour.toString().padLeft(2, '0')}:${task.dueDate!.minute.toString().padLeft(2, '0')}';

        await plugin.show(
          task.id.hashCode.abs(),
          minutesDiff <= 15
              ? '🔴 Task Due Very Soon!'
              : '⏰ Upcoming Task Reminder',
          '"${task.title}" is due at $timeStr (${minutesDiff.ceil()}m left)',
          NotificationDetails(
            android: AndroidNotificationDetails(
              'task_buddy_deadlines',
              'Task Deadline Reminders',
              channelDescription:
                  'Notifications for upcoming and overdue task deadlines',
              icon: '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
              enableVibration: true,
            ),
          ),
        );
        notified[key] = now.millisecondsSinceEpoch;
      }
    }

    // Overdue (within last 4 hours)
    if (minutesDiff < 0 && minutesDiff.abs() <= 240) {
      final key = 'overdue-${task.id}';
      final last = notified[key];

      if (last == null || now.millisecondsSinceEpoch - last > 2 * 60 * 60 * 1000) {
        final overdueMins = minutesDiff.abs().ceil();
        final overdueText = overdueMins >= 60
            ? '${overdueMins ~/ 60}h ${overdueMins % 60}m'
            : '$overdueMins minutes';

        await plugin.show(
          task.id.hashCode.abs() + 2000,
          '🚨 Overdue Task!',
          '"${task.title}" is overdue by $overdueText',
          NotificationDetails(
            android: AndroidNotificationDetails(
              'task_buddy_deadlines',
              'Task Deadline Reminders',
              channelDescription:
                  'Notifications for upcoming and overdue task deadlines',
              icon: '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
              enableVibration: true,
            ),
          ),
        );
        notified[key] = now.millisecondsSinceEpoch;
      }
    }
  }

  await prefs.setStringList('notified_task_keys', notified.keys.toList());
  await prefs.setStringList(
      'notified_task_times', notified.values.map((v) => v.toString()).toList());
}

// ─── Main foreground service class ──────────────────────────────────
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

  /// Initialize notification plugin, create channel, request permissions,
  /// AND start the persistent background service.
  static Future<void> initialize() async {
    tz.initializeTimeZones();

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _plugin.initialize(
      const InitializationSettings(android: androidSettings, iOS: iosSettings),
    );

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

    // Start the persistent background service
    await _initBackgroundService();
  }

  /// Configure and start the Android foreground service.
  static Future<void> _initBackgroundService() async {
    final service = FlutterBackgroundService();

    await service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: true,
        autoStartOnBoot: true,
        isForegroundMode: true,
        notificationChannelId: 'task_buddy_bg_service',
        initialNotificationTitle: 'Task Buddy',
        initialNotificationContent: 'Monitoring task deadlines...',
        foregroundServiceNotificationId: 777,
        foregroundServiceTypes: [AndroidForegroundType.dataSync],
      ),
      iosConfiguration: IosConfiguration(
        autoStart: true,
        onForeground: onStart,
        onBackground: _onIosBackground,
      ),
    );

    await service.startService();
  }

  @pragma('vm:entry-point')
  static Future<bool> _onIosBackground(ServiceInstance service) async {
    DartPluginRegistrant.ensureInitialized();
    return true;
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

  /// Schedule an exact OS-level alarm for a task due date.
  static Future<void> scheduleTaskAlarm(TodoTask task) async {
    if (task.isCompleted || task.dueDate == null) return;
    if (task.dueDate!.isBefore(DateTime.now())) return;

    try {
      final scheduledDate = tz.TZDateTime.from(task.dueDate!, tz.local);
      final notificationId = task.id.hashCode.abs();

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
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );

      // 15-minute early warning
      final earlyDate =
          scheduledDate.subtract(const Duration(minutes: 15));
      if (earlyDate.isAfter(tz.TZDateTime.now(tz.local))) {
        await _plugin.zonedSchedule(
          notificationId + 5000,
          '🔴 Task Due in 15 Minutes!',
          '"${task.title}" is due soon!',
          earlyDate,
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
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation:
              UILocalNotificationDateInterpretation.absoluteTime,
        );
      }
    } catch (e) {
      print('Error scheduling alarm for task ${task.id}: $e');
    }
  }

  /// Foreground periodic checks (while app is open).
  static void startPeriodicChecks(List<TodoTask> Function() tasksProvider) {
    _periodicTimer?.cancel();

    // Sync OS alarms for all future tasks
    for (final task in tasksProvider()) {
      scheduleTaskAlarm(task);
    }

    _periodicTimer = Timer.periodic(const Duration(seconds: 60), (_) async {
      final tasks = tasksProvider();
      for (final task in tasks) {
        scheduleTaskAlarm(task);
      }
      final prefs = await SharedPreferences.getInstance();
      await _bgCheckDeadlines(tasks, _plugin, prefs);
    });
  }

  static void stopPeriodicChecks() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

  static Future<void> sendTestNotification() async {
    await show(
      id: 888888,
      title: '🔔 Task Buddy Background Service Active',
      body:
          'Persistent background service is running. You will receive deadline alerts even when the app is closed.',
    );
  }
}

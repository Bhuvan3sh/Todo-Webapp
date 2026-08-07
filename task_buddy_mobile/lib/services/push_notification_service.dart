import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Background FCM message received: ${message.messageId}");
}

class PushNotificationService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'task_buddy_channel',
    'Task Notifications',
    description: 'Notifications for task reminders and due dates',
    importance: Importance.high,
  );

  static Future<void> initialize() async {
    // Background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted Push Notification permission');
    }

    // Configure local notification channel for Android foreground display
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(initSettings);

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // Listen for foreground FCM messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null) {
        showLocalNotification(
          title: notification.title ?? 'Task Buddy',
          body: notification.body ?? '',
        );
      }
    });

    // Save FCM Token to Supabase
    await syncFcmTokenToSupabase();

    _fcm.onTokenRefresh.listen((newToken) async {
      await saveTokenToSupabase(newToken);
    });
  }

  static Future<void> showLocalNotification({required String title, required String body}) async {
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
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
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
    );
  }

  static Future<void> sendTestNotification() async {
    await showLocalNotification(
      title: '🚀 Task Buddy Sync Active',
      body: 'Push notifications are synchronized with your Supabase database & phone!',
    );
  }

  static Future<void> syncFcmTokenToSupabase() async {
    try {
      String? token = await _fcm.getToken();
      if (token != null) {
        await saveTokenToSupabase(token);
      }
    } catch (e) {
      print('Error getting FCM token: $e');
    }
  }

  static Future<void> saveTokenToSupabase(String token) async {
    final client = Supabase.instance.client;
    final user = client.auth.currentUser;

    if (user != null) {
      try {
        await client.from('user_push_tokens').upsert({
          'user_id': user.id,
          'fcm_token': token,
          'device_type': Platform.isIOS ? 'ios' : 'android',
          'updated_at': DateTime.now().toIso8601String(),
        }, onConflict: 'fcm_token');
        print('FCM Token successfully synced to Supabase for user: ${user.id}');
      } catch (e) {
        print('Error saving FCM token to Supabase: $e');
      }
    }
  }
}

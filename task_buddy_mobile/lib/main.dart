import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'providers/app_provider.dart';
import 'services/local_notification_service.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase Backend with project credentials
  const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://gjduzipwtybvzvgefrza.supabase.co',
  );
  const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHV6aXB3dHlidnp2Z2VmcnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjI5NTYsImV4cCI6MjEwMDc5ODk1Nn0.Gwf4ZGAfOfS-5JNaqFlqeGq1f4jbdctwSU98M70uHIw',
  );

  try {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  } catch (e) {
    print('Supabase init notice: $e');
  }

  // Initialize Local Notification Service (no Firebase required)
  try {
    await LocalNotificationService.initialize();
  } catch (e) {
    print('Local notification init notice: $e');
  }

  runApp(const TaskBuddyApp());
}

class TaskBuddyApp extends StatelessWidget {
  const TaskBuddyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()..fetchData()),
      ],
      child: MaterialApp(
        title: 'Task Buddy',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const HomeScreen(),
      ),
    );
  }
}

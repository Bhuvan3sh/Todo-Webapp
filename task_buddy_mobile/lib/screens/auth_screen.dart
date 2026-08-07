import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_logo.dart';
import '../widgets/neumorphic_card.dart';

class AuthScreen extends StatefulWidget {
  final bool isModal;

  const AuthScreen({super.key, this.isModal = false});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const AuthScreen(isModal: true),
    );
  }

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSignUp = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter both email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final supabase = Supabase.instance.client;
      if (_isSignUp) {
        final res = await supabase.auth.signUp(email: email, password: password);
        if (res.user != null && res.session == null) {
          await supabase.auth.signInWithPassword(email: email, password: password);
        }
      } else {
        await supabase.auth.signInWithPassword(email: email, password: password);
      }

      if (mounted) {
        final provider = Provider.of<AppProvider>(context, listen: false);
        await provider.fetchData();
        if (widget.isModal) {
          Navigator.pop(context);
        }
      }
    } on AuthException catch (e) {
      setState(() => _errorMessage = e.message);
    } catch (e) {
      setState(() => _errorMessage = 'Authentication failed: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          const AppLogo(size: 54),
          const SizedBox(height: 16),
          Text(
            'Task Buddy',
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppTheme.primaryColor,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Sign in to access your synchronized tasks',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondaryLight),
          ),
          const SizedBox(height: 28),

          if (_errorMessage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Text(
                _errorMessage!,
                style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold),
              ),
            ),
          ],

          // Email Input
          Align(
            alignment: Alignment.centerLeft,
            child: const Text('Email Address', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 6),
          NeumorphicCard(
            isSunken: true,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                hintText: 'your-email@example.com',
                border: InputBorder.none,
                icon: Icon(Icons.email_outlined, size: 18, color: AppTheme.textSecondaryLight),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Password Input
          Align(
            alignment: Alignment.centerLeft,
            child: const Text('Password', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 6),
          NeumorphicCard(
            isSunken: true,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            child: TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                hintText: '••••••••',
                border: InputBorder.none,
                icon: Icon(Icons.lock_outline, size: 18, color: AppTheme.textSecondaryLight),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Submit Button
          SizedBox(
            width: double.infinity,
            child: NeumorphicButton(
              isPrimary: true,
              onTap: _isLoading ? () {} : _submitAuth,
              child: Center(
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(
                        _isSignUp ? 'Create Account & Sign In' : 'Sign In to Task Buddy',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Toggle Sign In / Sign Up
          GestureDetector(
            onTap: () {
              setState(() {
                _isSignUp = !_isSignUp;
                _errorMessage = null;
              });
            },
            child: Text.rich(
              TextSpan(
                text: _isSignUp ? 'Already have an account? ' : "Don't have an account yet? ",
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondaryLight),
                children: [
                  TextSpan(
                    text: _isSignUp ? 'Sign In' : 'Sign Up',
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    if (widget.isModal) {
      return Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.88,
        ),
        decoration: const BoxDecoration(
          color: AppTheme.backgroundColorLight,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: content,
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColorLight,
      body: SafeArea(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            child: content,
          ),
        ),
      ),
    );
  }
}

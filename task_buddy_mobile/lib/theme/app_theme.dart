import 'package:flutter/material.dart';

class AppTheme {
  // Brand Neumorphic Color Tokens
  static const Color primaryColor = Color(0xFF6C63FF);
  static const Color backgroundColorLight = Color(0xFFE0E5EC);
  static const Color textPrimaryLight = Color(0xFF2D3748);
  static const Color textSecondaryLight = Color(0xFF718096);

  static const Color lightShadowColor = Color(0xFFFFFFFF);
  static const Color darkShadowColor = Color(0xFFA3B1C6);

  // Priority Colors
  static const Color priorityHighBg = Color(0xFFFFE5E5);
  static const Color priorityHighText = Color(0xFFE53E3E);
  static const Color priorityMediumBg = Color(0xFFFFFAF0);
  static const Color priorityMediumText = Color(0xFFDD6B20);
  static const Color priorityLowBg = Color(0xFFE6FFFA);
  static const Color priorityLowText = Color(0xFF319795);

  // Cached Neumorphic Shadows for 60fps/120fps Rendering
  static const List<BoxShadow> raisedShadows = [
    BoxShadow(
      color: darkShadowColor,
      offset: Offset(4, 4),
      blurRadius: 10,
    ),
    BoxShadow(
      color: lightShadowColor,
      offset: Offset(-4, -4),
      blurRadius: 10,
    ),
  ];

  static const List<BoxShadow> primaryBtnShadows = [
    BoxShadow(
      color: Color(0x666C63FF),
      offset: Offset(3, 3),
      blurRadius: 8,
    ),
    BoxShadow(
      color: lightShadowColor,
      offset: Offset(-3, -3),
      blurRadius: 8,
    ),
  ];

  static List<BoxShadow> raisedSmShadow() => raisedShadows;
  static List<BoxShadow> accentButtonShadow() => primaryBtnShadows;

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundColorLight,
      primaryColor: primaryColor,
      colorScheme: const ColorScheme.light(
        primary: primaryColor,
        surface: backgroundColorLight,
      ),
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundColorLight,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: textPrimaryLight),
        titleTextStyle: TextStyle(
          color: textPrimaryLight,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          fontFamily: 'Roboto',
        ),
      ),
    );
  }
}

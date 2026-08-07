import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'neumorphic_card.dart';

class AppLogo extends StatelessWidget {
  final double size;

  const AppLogo({super.key, this.size = 36});

  @override
  Widget build(BuildContext context) {
    return NeumorphicCard(
      padding: EdgeInsets.all(size * 0.22),
      borderRadius: size * 0.3,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor,
          borderRadius: BorderRadius.circular(size * 0.22),
          boxShadow: AppTheme.accentButtonShadow(),
        ),
        child: Icon(
          Icons.check_box_rounded,
          color: Colors.white,
          size: size * 0.65,
        ),
      ),
    );
  }
}

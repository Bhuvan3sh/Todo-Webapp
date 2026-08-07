import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class NeumorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final bool isSunken;
  final VoidCallback? onTap;

  const NeumorphicCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.borderRadius = 16,
    this.isSunken = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardWidget = Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: AppTheme.backgroundColorLight,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isSunken ? null : AppTheme.raisedShadows,
        border: isSunken
            ? Border.all(color: const Color(0xFFA3B1C6).withOpacity(0.5), width: 1.5)
            : null,
      ),
      child: child,
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: cardWidget,
      );
    }

    return cardWidget;
  }
}

class NeumorphicButton extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final bool isPrimary;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  const NeumorphicButton({
    super.key,
    required this.child,
    required this.onTap,
    this.isPrimary = false,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    this.borderRadius = 16,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        padding: padding,
        decoration: BoxDecoration(
          color: isPrimary ? AppTheme.primaryColor : AppTheme.backgroundColorLight,
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: isPrimary ? AppTheme.primaryBtnShadows : AppTheme.raisedShadows,
        ),
        child: child,
      ),
    );
  }
}

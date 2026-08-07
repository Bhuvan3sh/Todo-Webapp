import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/settings_screen.dart';
import '../theme/app_theme.dart';
import 'app_logo.dart';
import 'neumorphic_card.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final user = provider.currentUser;

    return Drawer(
      backgroundColor: AppTheme.backgroundColorLight,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drawer Header with AppLogo & Email
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  const AppLogo(size: 32),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Task Buddy',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.primaryColor,
                            letterSpacing: -0.5,
                          ),
                        ),
                        Text(
                          user?.email ?? 'Logged In',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.textSecondaryLight,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFA3B1C6)),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                children: [
                  // Today Tasks Item
                  _DrawerItem(
                    icon: Icons.wb_sunny_outlined,
                    title: "Today's Tasks",
                    isSelected: provider.activeView == ViewMode.today,
                    onTap: () {
                      provider.setActiveView(ViewMode.today);
                      Navigator.pop(context);
                    },
                  ),

                  // Upcoming Tasks Item
                  _DrawerItem(
                    icon: Icons.calendar_month_outlined,
                    title: 'Upcoming Tasks',
                    isSelected: provider.activeView == ViewMode.upcoming,
                    onTap: () {
                      provider.setActiveView(ViewMode.upcoming);
                      Navigator.pop(context);
                    },
                  ),

                  // Settings Item (Strictly "Settings")
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    title: 'Settings',
                    isSelected: false,
                    onTap: () {
                      Navigator.pop(context);
                      SettingsScreen.show(context);
                    },
                  ),

                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                    child: Text(
                      'MY LISTS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textSecondaryLight,
                        letterSpacing: 1,
                      ),
                    ),
                  ),

                  // Lists with Share & Delete Options
                  ...provider.lists.map((list) {
                    final isSelected = provider.activeView == ViewMode.list &&
                        provider.activeListId == list.id;
                    return _DrawerListItem(
                      list: list,
                      isSelected: isSelected,
                      onTap: () {
                        provider.setActiveList(list.id);
                        Navigator.pop(context);
                      },
                      onShare: () {
                        _shareListLink(context, list);
                      },
                      onDelete: () {
                        _confirmDeleteList(context, provider, list);
                      },
                    );
                  }),

                  const SizedBox(height: 12),

                  // Add New List Button
                  NeumorphicButton(
                    onTap: () {
                      Navigator.pop(context);
                      _showAddListDialog(context, provider);
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.add, color: AppTheme.primaryColor, size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Add New List',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _shareListLink(BuildContext context, dynamic list) {
    final shareUrl = 'https://todo.theorave.in/share?listId=${list.id}&title=${Uri.encodeComponent(list.title)}';
    Clipboard.setData(ClipboardData(text: shareUrl));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied share link for "${list.title}"! Send on WhatsApp to share.'),
        backgroundColor: AppTheme.primaryColor,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _confirmDeleteList(BuildContext context, AppProvider provider, dynamic list) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.backgroundColorLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete "${list.title}"?'),
        content: const Text('Deleting this list will remove all tasks inside it from Supabase and local storage.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondaryLight)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () {
              provider.deleteList(list.id);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Deleted list "${list.title}"'), backgroundColor: Colors.red),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showAddListDialog(BuildContext context, AppProvider provider) {
    final titleController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.backgroundColorLight,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Create New List', style: TextStyle(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: titleController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'List Title (e.g. Work, Personal)',
            filled: true,
            fillColor: AppTheme.backgroundColorLight,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondaryLight)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              if (titleController.text.trim().isNotEmpty) {
                provider.addList(titleController.text.trim());
                Navigator.pop(ctx);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color? color;
  final bool isSelected;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.title,
    this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: NeumorphicCard(
        isSunken: isSelected,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        onTap: onTap,
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? AppTheme.primaryColor : (color ?? AppTheme.textSecondaryLight),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppTheme.primaryColor : AppTheme.textPrimaryLight,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerListItem extends StatelessWidget {
  final dynamic list;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onShare;
  final VoidCallback onDelete;

  const _DrawerListItem({
    required this.list,
    required this.isSelected,
    required this.onTap,
    required this.onShare,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final listColor = Color(int.parse(list.color?.replaceFirst('#', '0xFF') ?? '0xFF6C63FF'));

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: NeumorphicCard(
        isSunken: isSelected,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        onTap: onTap,
        child: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: listColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                list.title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppTheme.primaryColor : AppTheme.textPrimaryLight,
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.share_outlined, size: 18, color: AppTheme.primaryColor),
              onPressed: onShare,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Share list',
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
              onPressed: onDelete,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Delete list',
            ),
          ],
        ),
      ),
    );
  }
}

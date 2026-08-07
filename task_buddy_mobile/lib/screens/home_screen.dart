import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/todo_models.dart';
import '../providers/app_provider.dart';
import '../screens/auth_screen.dart';
import '../screens/settings_screen.dart';
import '../widgets/app_drawer.dart';
import '../widgets/neumorphic_card.dart';
import '../widgets/task_card.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _searchController = TextEditingController();
  
  bool _showSearch = false;
  String _taskStatusFilter = 'all'; // 'all', 'pending', 'done'
  String _upcomingDateRange = 'all'; // 'all', '1day', '2days', '3days', '7days', 'custom'
  DateTime? _selectedCustomDate;
  int _currentBottomNavIndex = 0;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final user = provider.currentUser;

    // MANDATORY LOGIN ENFORCEMENT
    if (user == null) {
      return const AuthScreen(isModal: false);
    }

    final allTasks = provider.currentViewTasks;
    final query = _searchController.text.trim().toLowerCase();

    // 1. Search Filter
    final searchedTasks = query.isEmpty
        ? allTasks
        : allTasks.where((t) {
            final titleMatch = t.title.toLowerCase().contains(query);
            final descMatch = t.description?.toLowerCase().contains(query) ?? false;
            return titleMatch || descMatch;
          }).toList();

    // 2. Upcoming Date Filter
    List<TodoTask> dateFilteredTasks = searchedTasks;
    if (provider.activeView == ViewMode.upcoming) {
      final now = DateTime.now();
      final todayEnd = DateTime(now.year, now.month, now.day, 23, 59, 59);

      if (_upcomingDateRange == '1day') {
        final limit = todayEnd.add(const Duration(days: 1));
        dateFilteredTasks = searchedTasks.where((t) => t.dueDate != null && t.dueDate!.isBefore(limit)).toList();
      } else if (_upcomingDateRange == '2days') {
        final limit = todayEnd.add(const Duration(days: 2));
        dateFilteredTasks = searchedTasks.where((t) => t.dueDate != null && t.dueDate!.isBefore(limit)).toList();
      } else if (_upcomingDateRange == '3days') {
        final limit = todayEnd.add(const Duration(days: 3));
        dateFilteredTasks = searchedTasks.where((t) => t.dueDate != null && t.dueDate!.isBefore(limit)).toList();
      } else if (_upcomingDateRange == '7days') {
        final limit = todayEnd.add(const Duration(days: 7));
        dateFilteredTasks = searchedTasks.where((t) => t.dueDate != null && t.dueDate!.isBefore(limit)).toList();
      } else if (_upcomingDateRange == 'custom' && _selectedCustomDate != null) {
        dateFilteredTasks = searchedTasks.where((t) {
          if (t.dueDate == null) return false;
          return t.dueDate!.year == _selectedCustomDate!.year &&
                 t.dueDate!.month == _selectedCustomDate!.month &&
                 t.dueDate!.day == _selectedCustomDate!.day;
        }).toList();
      }
    }

    // 3. Status Filter ('all', 'pending', 'done')
    final finalTasks = dateFilteredTasks.where((t) {
      if (_taskStatusFilter == 'pending') return !t.isCompleted;
      if (_taskStatusFilter == 'done') return t.isCompleted;
      return true;
    }).toList();

    // Stat counts
    final totalListsCount = provider.lists.length;
    final totalTasksCount = provider.tasks.length;
    final todayCompletedCount = provider.tasks.where((t) {
      if (!t.isCompleted) return false;
      final now = DateTime.now();
      return t.createdAt.year == now.year &&
          t.createdAt.month == now.month &&
          t.createdAt.day == now.day;
    }).length;
    final overdueCount = provider.tasks.where((t) {
      if (t.isCompleted || t.dueDate == null) return false;
      return t.dueDate!.isBefore(DateTime.now().subtract(const Duration(days: 1)));
    }).length;

    // Filter counts for header switcher
    final allCount = dateFilteredTasks.length;
    final pendingCount = dateFilteredTasks.where((t) => !t.isCompleted).length;
    final doneCount = dateFilteredTasks.where((t) => t.isCompleted).length;

    // Progress percentage
    final completedInView = dateFilteredTasks.where((t) => t.isCompleted).length;
    final progressPercent = allCount == 0 ? 0 : ((completedInView / allCount) * 100).round();

    String viewTitle = "Tasks of the Day";
    if (provider.activeView == ViewMode.upcoming) {
      viewTitle = 'Upcoming Tasks';
    } else if (provider.activeView == ViewMode.list && provider.activeList != null) {
      viewTitle = provider.activeList!.title;
    }

    final formattedDate = DateFormat('EEEE, d MMM yyyy').format(DateTime.now());

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppTheme.backgroundColorLight,
      drawer: const AppDrawer(),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppTheme.primaryColor,
          onRefresh: () => provider.fetchData(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. TOP HEADER BAR
                Row(
                  children: [
                    // Drawer Button
                    NeumorphicCard(
                      borderRadius: 20,
                      padding: const EdgeInsets.all(10),
                      onTap: () => _scaffoldKey.currentState?.openDrawer(),
                      child: const Icon(Icons.menu_rounded, color: AppTheme.textPrimaryLight, size: 22),
                    ),
                    const SizedBox(width: 10),

                    // App Logo Badge
                    NeumorphicCard(
                      borderRadius: 14,
                      padding: const EdgeInsets.all(8),
                      child: const Icon(
                        Icons.check_box_rounded,
                        color: AppTheme.primaryColor,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 10),

                    // App Title
                    const Expanded(
                      child: Text(
                        'Task Buddy',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.textPrimaryLight,
                          letterSpacing: -0.4,
                        ),
                      ),
                    ),

                    // Search Toggle Button
                    NeumorphicCard(
                      borderRadius: 20,
                      padding: const EdgeInsets.all(10),
                      onTap: () => setState(() => _showSearch = !_showSearch),
                      child: Icon(
                        _showSearch ? Icons.close : Icons.search_rounded,
                        color: AppTheme.textPrimaryLight,
                        size: 22,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Search Bar (Expanded when search active)
                if (_showSearch) ...[
                  NeumorphicCard(
                    isSunken: true,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(
                        hintText: 'Search tasks...',
                        hintStyle: TextStyle(fontSize: 14, color: AppTheme.textSecondaryLight),
                        border: InputBorder.none,
                        icon: Icon(Icons.search, color: AppTheme.textSecondaryLight, size: 20),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // 2. STAT CARDS GRID (2x2) - SHOWN ONLY ON TODAY'S TASKS PAGE
                if (provider.activeView == ViewMode.today) ...[
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'TOTAL LISTS',
                          count: totalListsCount,
                          icon: Icons.folder_outlined,
                          iconColor: AppTheme.primaryColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'TOTAL TASKS',
                          count: totalTasksCount,
                          icon: Icons.format_list_bulleted_rounded,
                          iconColor: AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          title: 'COMPLETED TODAY',
                          count: todayCompletedCount,
                          icon: Icons.check_circle_outline_rounded,
                          iconColor: const Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          title: 'OVERDUE TASKS',
                          count: overdueCount,
                          icon: Icons.error_outline_rounded,
                          iconColor: const Color(0xFFEF4444),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                ],

                // 3. UPCOMING DATE FILTER (Shown when viewing Upcoming Tasks)
                if (provider.activeView == ViewMode.upcoming) ...[
                  NeumorphicCard(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: const [
                                Icon(Icons.filter_list_rounded, size: 18, color: AppTheme.primaryColor),
                                SizedBox(width: 6),
                                Text(
                                  'Filter Upcoming Range:',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.textPrimaryLight),
                                ),
                              ],
                            ),
                            if (_selectedCustomDate != null)
                              Text(
                                DateFormat('MMM d').format(_selectedCustomDate!),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                              ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _DateChip(
                                label: 'All',
                                isSelected: _upcomingDateRange == 'all',
                                onTap: () => setState(() => _upcomingDateRange = 'all'),
                              ),
                              _DateChip(
                                label: 'Next 1 Day',
                                isSelected: _upcomingDateRange == '1day',
                                onTap: () => setState(() => _upcomingDateRange = '1day'),
                              ),
                              _DateChip(
                                label: 'Next 2 Days',
                                isSelected: _upcomingDateRange == '2days',
                                onTap: () => setState(() => _upcomingDateRange = '2days'),
                              ),
                              _DateChip(
                                label: 'Next 3 Days',
                                isSelected: _upcomingDateRange == '3days',
                                onTap: () => setState(() => _upcomingDateRange = '3days'),
                              ),
                              _DateChip(
                                label: 'Next 7 Days',
                                isSelected: _upcomingDateRange == '7days',
                                onTap: () => setState(() => _upcomingDateRange = '7days'),
                              ),
                              _DateChip(
                                label: 'Pick Date 📅',
                                isSelected: _upcomingDateRange == 'custom',
                                onTap: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: DateTime.now().add(const Duration(days: 1)),
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 365)),
                                  );
                                  if (picked != null) {
                                    setState(() {
                                      _selectedCustomDate = picked;
                                      _upcomingDateRange = 'custom';
                                    });
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                // 4. TASKS OF THE DAY BANNER CARD (Neumorphic Raised)
                NeumorphicCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.amber.shade100,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.wb_sunny_rounded, color: Colors.amber.shade800, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        viewTitle,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          color: AppTheme.textPrimaryLight,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.amber.shade200.withOpacity(0.6),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        provider.activeView == ViewMode.upcoming ? 'UPCOMING' : 'TODAY',
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.amber.shade900,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  formattedDate,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Filter Switcher & Add Button Row
                      Row(
                        children: [
                          Expanded(
                            child: NeumorphicCard(
                              isSunken: true,
                              padding: const EdgeInsets.all(4),
                              child: Row(
                                children: [
                                  _FilterTab(
                                    label: 'All ($allCount)',
                                    isSelected: _taskStatusFilter == 'all',
                                    onTap: () => setState(() => _taskStatusFilter = 'all'),
                                  ),
                                  _FilterTab(
                                    label: 'Pending ($pendingCount)',
                                    isSelected: _taskStatusFilter == 'pending',
                                    onTap: () => setState(() => _taskStatusFilter = 'pending'),
                                  ),
                                  _FilterTab(
                                    label: 'Done ($doneCount)',
                                    isSelected: _taskStatusFilter == 'done',
                                    onTap: () => setState(() => _taskStatusFilter = 'done'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          NeumorphicButton(
                            isPrimary: true,
                            borderRadius: 14,
                            padding: const EdgeInsets.all(10),
                            onTap: () => _showAddTaskModal(context, provider),
                            child: const Icon(Icons.add, color: Colors.white, size: 20),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Progress Indicator Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "Task Progress",
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textSecondaryLight),
                          ),
                          Text(
                            '$completedInView/$allCount ($progressPercent%)',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppTheme.primaryColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: allCount == 0 ? 0 : (completedInView / allCount),
                          backgroundColor: const Color(0xFFD1D9E6),
                          valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryColor),
                          minHeight: 8,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // 5. TASK LIST CONTAINER
                NeumorphicCard(
                  padding: const EdgeInsets.all(16),
                  child: provider.isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(32),
                          child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
                        )
                      : finalTasks.isEmpty
                          ? _EmptyStateCard(
                              onAddTask: () => _showAddTaskModal(context, provider),
                            )
                          : ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: finalTasks.length,
                              itemBuilder: (context, index) {
                                final task = finalTasks[index];
                                return TaskCard(
                                  task: task,
                                  onToggle: () => provider.toggleTaskCompletion(task),
                                  onDelete: () => provider.deleteTask(task.id),
                                );
                              },
                            ),
                ),
                const SizedBox(height: 80),
              ],
            ),
          ),
        ),
      ),

      // Floating Purple Action Button
      floatingActionButton: NeumorphicButton(
        isPrimary: true,
        borderRadius: 30,
        padding: const EdgeInsets.all(16),
        onTap: () => _showAddTaskModal(context, provider),
        child: const Icon(Icons.add, size: 26, color: Colors.white),
      ),

      // 6. CLEAN BOTTOM NAVIGATION BAR
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.backgroundColorLight,
          boxShadow: [
            BoxShadow(color: Color(0xFFA3B1C6), offset: Offset(0, -4), blurRadius: 10),
            BoxShadow(color: Colors.white, offset: Offset(0, 4), blurRadius: 10),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _BottomNavItem(
                  icon: Icons.wb_sunny_rounded,
                  label: 'Today',
                  isSelected: _currentBottomNavIndex == 0,
                  onTap: () {
                    setState(() => _currentBottomNavIndex = 0);
                    provider.setActiveView(ViewMode.today);
                  },
                ),
                _BottomNavItem(
                  icon: Icons.layers_rounded,
                  label: 'Lists',
                  isSelected: _currentBottomNavIndex == 1,
                  onTap: () {
                    setState(() => _currentBottomNavIndex = 1);
                    _scaffoldKey.currentState?.openDrawer();
                  },
                ),
                _BottomNavItem(
                  icon: Icons.add_circle_outline_rounded,
                  label: 'New List',
                  isSelected: _currentBottomNavIndex == 2,
                  onTap: () {
                    _showAddListDialog(context, provider);
                  },
                ),
              ],
            ),
          ),
        ),
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

  void _showAddTaskModal(BuildContext context, AppProvider provider) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String selectedPriority = 'medium';
    DateTime? selectedDate;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setStateModal) {
            return Container(
              decoration: const BoxDecoration(
                color: AppTheme.backgroundColorLight,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Add New Task',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimaryLight,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppTheme.textSecondaryLight),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title input
                  NeumorphicCard(
                    isSunken: true,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    child: TextField(
                      controller: titleController,
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Task Title...',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Description input
                  NeumorphicCard(
                    isSunken: true,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    child: TextField(
                      controller: descController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        hintText: 'Description (optional)...',
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Priority Choice Chips
                  const Text('Priority:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      ChoiceChip(
                        label: const Text('HIGH'),
                        selected: selectedPriority == 'high',
                        selectedColor: AppTheme.priorityHighBg,
                        labelStyle: TextStyle(
                          color: selectedPriority == 'high' ? AppTheme.priorityHighText : AppTheme.textSecondaryLight,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (val) {
                          if (val) setStateModal(() => selectedPriority = 'high');
                        },
                      ),
                      ChoiceChip(
                        label: const Text('MEDIUM'),
                        selected: selectedPriority == 'medium',
                        selectedColor: AppTheme.priorityMediumBg,
                        labelStyle: TextStyle(
                          color: selectedPriority == 'medium' ? AppTheme.priorityMediumText : AppTheme.textSecondaryLight,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (val) {
                          if (val) setStateModal(() => selectedPriority = 'medium');
                        },
                      ),
                      ChoiceChip(
                        label: const Text('LOW'),
                        selected: selectedPriority == 'low',
                        selectedColor: AppTheme.priorityLowBg,
                        labelStyle: TextStyle(
                          color: selectedPriority == 'low' ? AppTheme.priorityLowText : AppTheme.textSecondaryLight,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (val) {
                          if (val) setStateModal(() => selectedPriority = 'low');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Due Date & Time picker button
                  NeumorphicButton(
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now().subtract(const Duration(days: 1)),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (date != null && context.mounted) {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.now(),
                        );
                        final selectedDateTime = DateTime(
                          date.year,
                          date.month,
                          date.day,
                          time?.hour ?? 12,
                          time?.minute ?? 0,
                        );
                        setStateModal(() => selectedDate = selectedDateTime);
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.schedule_rounded, size: 16, color: AppTheme.primaryColor),
                        const SizedBox(width: 8),
                        Text(
                          selectedDate == null
                              ? 'Set Due Date & Time'
                              : 'Due: ${DateFormat('MMM d, h:mm a').format(selectedDate!)}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.primaryColor),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Create Task submit button
                  SizedBox(
                    width: double.infinity,
                    child: NeumorphicButton(
                      isPrimary: true,
                      onTap: () {
                        if (titleController.text.trim().isNotEmpty) {
                          provider.addTask(
                            title: titleController.text.trim(),
                            description: descController.text.trim().isEmpty
                                ? null
                                : descController.text.trim(),
                            priority: selectedPriority,
                            dueDate: selectedDate,
                          );
                          Navigator.pop(ctx);
                        }
                      },
                      child: const Center(
                        child: Text(
                          'Create Task',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color iconColor;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return NeumorphicCard(
      padding: const EdgeInsets.all(12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textSecondaryLight,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$count',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.textPrimaryLight,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 4),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
        ],
      ),
    );
  }
}

class _DateChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _DateChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryColor : AppTheme.backgroundColorLight,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? null
                : const [
                    BoxShadow(color: Color(0xFFA3B1C6), offset: Offset(2, 2), blurRadius: 4),
                    BoxShadow(color: Colors.white, offset: Offset(-2, -2), blurRadius: 4),
                  ],
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : AppTheme.textSecondaryLight,
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterTab({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.backgroundColorLight : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? const [
                    BoxShadow(color: Color(0xFFA3B1C6), offset: Offset(2, 2), blurRadius: 4),
                    BoxShadow(color: Colors.white, offset: Offset(-2, -2), blurRadius: 4),
                  ]
                : null,
          ),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryLight,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  final VoidCallback onAddTask;

  const _EmptyStateCard({required this.onAddTask});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber.shade100,
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.wb_sunny_rounded, size: 36, color: Colors.amber.shade800),
        ),
        const SizedBox(height: 14),
        const Text(
          'No tasks found',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            color: AppTheme.textPrimaryLight,
          ),
        ),
        const SizedBox(height: 6),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            "You're all clear! Click below to add a new task or pick from your lists.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondaryLight, height: 1.4),
          ),
        ),
        const SizedBox(height: 18),
        NeumorphicButton(
          isPrimary: true,
          onTap: onAddTask,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.add, color: Colors.white, size: 18),
              SizedBox(width: 6),
              Text(
                "Add Task",
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _BottomNavItem({
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 22,
            color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryLight,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
              color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }
}

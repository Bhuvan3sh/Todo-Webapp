class TodoList {
  final String id;
  final String title;
  final String? description;
  final String? color;
  final DateTime? deadline;
  final DateTime createdAt;
  final String? userId;

  TodoList({
    required this.id,
    required this.title,
    this.description,
    this.color,
    this.deadline,
    required this.createdAt,
    this.userId,
  });

  factory TodoList.fromJson(Map<String, dynamic> json) {
    return TodoList(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Untitled List',
      description: json['description'] as String?,
      color: json['color'] as String? ?? '#6C63FF',
      deadline: json['deadline'] != null ? DateTime.tryParse(json['deadline'])?.toLocal() : null,
      createdAt: json['created_at'] != null ? (DateTime.tryParse(json['created_at'])?.toLocal() ?? DateTime.now()) : DateTime.now(),
      userId: json['user_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'color': color,
      'deadline': deadline?.toUtc().toIso8601String(),
      'created_at': createdAt.toUtc().toIso8601String(),
      'user_id': userId,
    };
  }

  Map<String, dynamic> toInsertJson() {
    final map = <String, dynamic>{
      'title': title,
      'description': description,
      'color': color,
      'deadline': deadline?.toUtc().toIso8601String(),
      'created_at': createdAt.toUtc().toIso8601String(),
      'user_id': userId,
    };
    if (RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(id)) {
      map['id'] = id;
    }
    return map;
  }
}

class TodoTask {
  final String id;
  final String listId;
  final String title;
  final String? description;
  final String priority; // 'high' | 'medium' | 'low'
  final DateTime? dueDate;
  final bool isCompleted;
  final int position;
  final DateTime createdAt;
  final String? userId;

  TodoTask({
    required this.id,
    required this.listId,
    required this.title,
    this.description,
    this.priority = 'medium',
    this.dueDate,
    this.isCompleted = false,
    this.position = 0,
    required this.createdAt,
    this.userId,
  });

  factory TodoTask.fromJson(Map<String, dynamic> json) {
    return TodoTask(
      id: json['id'] as String,
      listId: json['list_id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      priority: (json['priority'] as String? ?? 'medium').toLowerCase(),
      dueDate: json['due_date'] != null ? DateTime.tryParse(json['due_date'])?.toLocal() : null,
      isCompleted: json['is_completed'] as bool? ?? false,
      position: json['position'] as int? ?? 0,
      createdAt: json['created_at'] != null ? (DateTime.tryParse(json['created_at'])?.toLocal() ?? DateTime.now()) : DateTime.now(),
      userId: json['user_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'list_id': listId,
      'title': title,
      'description': description,
      'priority': priority,
      'due_date': dueDate?.toUtc().toIso8601String(),
      'is_completed': isCompleted,
      'position': position,
      'created_at': createdAt.toUtc().toIso8601String(),
      'user_id': userId,
    };
  }

  Map<String, dynamic> toInsertJson() {
    final map = <String, dynamic>{
      'list_id': listId,
      'title': title,
      'description': description,
      'priority': priority,
      'due_date': dueDate?.toUtc().toIso8601String(),
      'is_completed': isCompleted,
      'position': position,
      'created_at': createdAt.toUtc().toIso8601String(),
      'user_id': userId,
    };
    if (RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(id)) {
      map['id'] = id;
    }
    return map;
  }

  TodoTask copyWith({
    String? title,
    String? description,
    String? priority,
    DateTime? dueDate,
    bool? isCompleted,
    int? position,
  }) {
    return TodoTask(
      id: id,
      listId: listId,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      dueDate: dueDate ?? this.dueDate,
      isCompleted: isCompleted ?? this.isCompleted,
      position: position ?? this.position,
      createdAt: createdAt,
      userId: userId,
    );
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:task_buddy_mobile/main.dart';

void main() {
  testWidgets('App initialization test', (WidgetTester tester) async {
    await tester.pumpWidget(const TaskBuddyApp());
    expect(find.byType(TaskBuddyApp), findsOneWidget);
  });
}

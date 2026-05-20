import 'package:flutter_test/flutter_test.dart';

import 'package:crewith_mobile/main.dart';

void main() {
  testWidgets('renders Crewith home shell', (WidgetTester tester) async {
    await tester.pumpWidget(const CrewithApp());
    await tester.pump();

    expect(find.text('서울 러너스'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('일정'), findsOneWidget);
    expect(find.text('공지'), findsOneWidget);
    expect(find.text('회비'), findsOneWidget);
  });
}

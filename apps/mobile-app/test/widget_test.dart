import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crewith_mobile/main.dart';

void main() {
  testWidgets('renders Crewith home shell after phone auth',
      (WidgetTester tester) async {
    await tester.pumpWidget(const CrewithApp());
    await tester.pump();

    expect(find.text('휴대폰 인증'), findsOneWidget);
    await tester.tap(find.text('인증 확인'));
    await tester.pump(const Duration(seconds: 4));
    await tester.pumpAndSettle();

    expect(find.text('서울 러너스'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('일정'), findsOneWidget);
    expect(find.text('공지'), findsOneWidget);
    expect(find.text('회비'), findsOneWidget);
    expect(find.text('알림'), findsOneWidget);

    await tester.tap(find.text('일정'));
    await tester.pumpAndSettle();
    expect(find.text('참석'), findsOneWidget);
    expect(find.text('불참'), findsOneWidget);

    await tester.tap(find.text('공지'));
    await tester.pumpAndSettle();
    expect(find.text('확인 처리'), findsOneWidget);
    expect(find.text('좋아요'), findsOneWidget);
    expect(find.text('댓글 등록'), findsOneWidget);

    await tester.tap(find.text('알림'));
    await tester.pumpAndSettle();
    expect(find.text('아직 수신된 알림이 없습니다.'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.menu_outlined));
    await tester.pumpAndSettle();
    expect(find.text('내 모임 정보와 가입 신청을 관리합니다.'), findsOneWidget);

    await tester.drag(find.byType(ListView).last, const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('가입 신청'), findsAtLeastNWidgets(1));

    await tester.drag(find.byType(ListView).last, const Offset(0, -500));
    await tester.pumpAndSettle();
    expect(find.text('초대 코드 확인'), findsOneWidget);
  });
}

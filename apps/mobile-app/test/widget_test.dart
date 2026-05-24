import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:crewith_mobile/main.dart';
import 'package:crewith_mobile/member_api_client.dart';
import 'package:crewith_mobile/member_models.dart';

class _FakeMemberApiClient extends MemberApiClient {
  @override
  Future<MemberAppOverview> fetchOverview({
    required String clubId,
    required String memberId,
  }) async =>
      MemberAppOverview.seed();

  @override
  Future<List<MemberDirectoryItem>> fetchMemberDirectory({
    required String clubId,
    required String memberId,
  }) async =>
      MemberDirectoryItem.seedItems;

  @override
  Future<List<MemberNotification>> fetchNotifications({
    required String memberId,
  }) async =>
      const [];

  @override
  Future<bool> requestOtp(String phoneNumber) async => true;

  @override
  Future<AuthSession?> verifyOtp(String phoneNumber, String code) async {
    return AuthSession(
      memberId: 'member-03',
      clubs: const [
        ClubSummary(
          clubId: 'club-seoul-runners',
          name: '서울 러너스',
          sportType: '러닝',
          role: 'member',
          memberStatus: 'active',
        ),
      ],
    );
  }

  @override
  Future<bool> registerDevice({
    required String memberId,
    required String fcmToken,
    String platform = 'android',
  }) async =>
      true;

  @override
  Future<bool> updateProfile(
    String memberId, {
    required String name,
    required String profileImageUrl,
  }) async =>
      true;

  @override
  Future<bool> updateEventResponse({
    required String clubId,
    required String eventId,
    required String memberId,
    required String response,
  }) async =>
      true;

  @override
  Future<bool> markNoticeRead({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) async =>
      true;

  @override
  Future<bool> toggleNoticeReaction({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) async =>
      true;

  @override
  Future<bool> createNoticeComment({
    required String clubId,
    required String noticeId,
    required String memberId,
    required String body,
  }) async =>
      true;

  @override
  Future<bool> markNotificationRead({
    required String memberId,
    required String notificationId,
  }) async =>
      true;

  @override
  Future<bool> submitFeedback({
    required String title,
    required String body,
    required String category,
    String? memberId,
  }) async =>
      true;

  @override
  Future<bool> createJoinRequest({
    required String clubId,
    required String name,
    required String phoneNumber,
    required String greeting,
  }) async =>
      true;

  @override
  Future<bool> acceptInvite({
    required String clubId,
    required String token,
    required String name,
    required String phoneNumber,
  }) async =>
      true;
}

void main() {
  testWidgets('renders Crewith home shell after phone auth',
      (WidgetTester tester) async {
    await tester.pumpWidget(CrewithApp(api: _FakeMemberApiClient()));
    await tester.pump();

    expect(find.text('휴대폰 인증'), findsOneWidget);
    await tester.tap(find.text('인증 확인'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(find.text('서울 러너스'), findsOneWidget);
    expect(find.text('홈'), findsOneWidget);
    expect(find.text('일정'), findsOneWidget);
    expect(find.text('공지'), findsOneWidget);
    expect(find.text('회비'), findsOneWidget);
    expect(find.text('구성원'), findsOneWidget);
    expect(find.text('알림'), findsOneWidget);

    await tester.tap(find.text('일정'));
    await tester.pumpAndSettle();
    // 시드 데이터: event-01 response='not_attending' → 버튼은 '✅ 참석'
    expect(find.text('✅ 참석'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('공지'));
    await tester.pumpAndSettle();
    // 시드 데이터: notice-01 read=false
    expect(find.text('✔️ 확인 처리'), findsOneWidget);
    expect(find.text('좋아요'), findsOneWidget);

    await tester.tap(find.text('구성원'));
    await tester.pumpAndSettle();
    expect(find.text('박도윤'), findsAtLeastNWidgets(1));

    await tester.tap(find.text('알림'));
    await tester.pumpAndSettle();
    expect(find.text('아직 수신한 알림이 없습니다.'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.menu_outlined));
    await tester.pumpAndSettle();
    expect(find.text('내 모임 정보와 가입 신청을 관리합니다.'), findsOneWidget);
  });

  testWidgets('shows error state when API throws', (WidgetTester tester) async {
    final errorApi = _ErrorMemberApiClient();
    await tester.pumpWidget(CrewithApp(api: errorApi));
    await tester.pump();

    // 인증 통과 (OTP는 항상 성공)
    await tester.tap(find.text('인증 확인'));
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    // fetchOverview가 throw하면 에러 UI가 표시되어야 함
    expect(find.text('연결에 실패했습니다.'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
  });
}

// fetchOverview가 예외를 던지는 가짜 클라이언트
class _ErrorMemberApiClient extends _FakeMemberApiClient {
  @override
  Future<MemberAppOverview> fetchOverview({
    required String clubId,
    required String memberId,
  }) async =>
      throw Exception('네트워크 오류');

  @override
  Future<List<MemberDirectoryItem>> fetchMemberDirectory({
    required String clubId,
    required String memberId,
  }) async =>
      throw Exception('네트워크 오류');
}

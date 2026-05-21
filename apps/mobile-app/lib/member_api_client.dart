import 'dart:convert';
import 'dart:io';

import 'member_models.dart';

const _defaultApiBaseUrl = String.fromEnvironment(
  'CREWITH_API_BASE_URL',
  defaultValue: 'http://10.0.2.2:4000/api/v1',
);

class MemberApiClient {
  const MemberApiClient({
    this.apiBaseUrl = _defaultApiBaseUrl,
  });

  final String apiBaseUrl;

  Future<MemberAppOverview> fetchOverview({
    required String clubId,
    required String memberId,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/clubs/$clubId/member-app/$memberId');
    final client = _client();

    try {
      final request = await client.getUrl(uri);
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode != HttpStatus.ok) {
        return MemberAppOverview.seed();
      }

      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return MemberAppOverview.fromJson(json['data'] as Map<String, dynamic>);
    } catch (_) {
      return MemberAppOverview.seed();
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> requestOtp(String phoneNumber) async {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/auth/otp/request'),
      {'phoneNumber': phoneNumber},
    );
  }

  Future<AuthSession?> verifyOtp(String phoneNumber, String code) async {
    final client = _client();

    try {
      final request =
          await client.postUrl(Uri.parse('$apiBaseUrl/auth/otp/verify'));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'phoneNumber': phoneNumber, 'code': code}));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final payload = await response.transform(utf8.decoder).join();
        final json = jsonDecode(payload) as Map<String, dynamic>;
        final data = json['data'] as Map<String, dynamic>;
        return AuthSession.fromJson(data);
      }
    } catch (_) {
      return null;
    } finally {
      client.close(force: true);
    }

    return null;
  }

  Future<bool> updateProfile(
    String memberId, {
    required String name,
    required String profileImageUrl,
  }) {
    return _sendJson(
      'PATCH',
      Uri.parse('$apiBaseUrl/members/$memberId/profile'),
      {
        'name': name,
        'profileImageUrl': profileImageUrl,
      },
    );
  }

  Future<bool> registerDevice({
    required String memberId,
    required String fcmToken,
    String platform = 'android',
  }) {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/me/devices'),
      {
        'memberId': memberId,
        'platform': platform,
        'fcmToken': fcmToken,
      },
    );
  }

  Future<bool> updateEventResponse({
    required String clubId,
    required String eventId,
    required String memberId,
    required String response,
  }) {
    return _sendJson(
      'PATCH',
      Uri.parse('$apiBaseUrl/clubs/$clubId/events/$eventId/responses'),
      {
        'memberId': memberId,
        'response': response,
      },
    );
  }

  Future<bool> markNoticeRead({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) {
    return _sendJson(
      'PATCH',
      Uri.parse('$apiBaseUrl/clubs/$clubId/notices/$noticeId/read'),
      {'memberId': memberId},
    );
  }

  Future<bool> toggleNoticeReaction({
    required String clubId,
    required String noticeId,
    required String memberId,
  }) {
    return _sendJson(
      'PATCH',
      Uri.parse('$apiBaseUrl/clubs/$clubId/notices/$noticeId/reactions'),
      {'memberId': memberId},
    );
  }

  Future<bool> createNoticeComment({
    required String clubId,
    required String noticeId,
    required String memberId,
    required String body,
  }) {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/clubs/$clubId/notices/$noticeId/comments'),
      {
        'memberId': memberId,
        'body': body,
      },
    );
  }

  Future<bool> createJoinRequest({
    required String clubId,
    required String name,
    required String phoneNumber,
    required String greeting,
  }) {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/clubs/$clubId/join-requests'),
      {
        'applicantName': name,
        'applicantPhone': phoneNumber,
        'greeting': greeting,
      },
    );
  }

  Future<bool> acceptInvite({
    required String clubId,
    required String token,
    required String name,
    required String phoneNumber,
  }) {
    return _sendJson(
      'POST',
      Uri.parse(
          '$apiBaseUrl/clubs/$clubId/invite-links/${token.trim()}/accept'),
      {
        'applicantName': name,
        'applicantPhone': phoneNumber,
      },
    );
  }

  HttpClient _client() {
    return HttpClient()..connectionTimeout = const Duration(seconds: 2);
  }

  Future<bool> _sendJson(
    String method,
    Uri uri,
    Map<String, Object?> body,
  ) async {
    final client = _client();

    try {
      final request = switch (method) {
        'PATCH' => await client.patchUrl(uri),
        'POST' => await client.postUrl(uri),
        _ => await client.postUrl(uri),
      };
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(body));
      final response =
          await request.close().timeout(const Duration(seconds: 3));

      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}

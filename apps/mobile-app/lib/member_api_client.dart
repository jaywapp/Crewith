import 'dart:convert';
import 'dart:io';

import 'member_models.dart';

const _defaultApiBaseUrl = String.fromEnvironment(
  'CREWITH_API_BASE_URL',
  defaultValue: 'https://crewith-api-production.up.railway.app/api/v1',
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
          await request.close().timeout(const Duration(seconds: 15));

      if (response.statusCode != HttpStatus.ok) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return MemberAppOverview.fromJson(json['data'] as Map<String, dynamic>);
    } finally {
      client.close(force: true);
    }
  }

  Future<AuthSession?> login(String phoneNumber, String password) async {
    final client = _client();
    try {
      final request = await client.postUrl(Uri.parse('$apiBaseUrl/auth/login'));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'phoneNumber': phoneNumber, 'password': password}));
      final response = await request.close().timeout(const Duration(seconds: 15));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final payload = await response.transform(utf8.decoder).join();
        final json = jsonDecode(payload) as Map<String, dynamic>;
        return AuthSession.fromJson(json['data'] as Map<String, dynamic>);
      }
    } catch (_) {
      return null;
    } finally {
      client.close(force: true);
    }
    return null;
  }

  Future<String?> register({
    required String name,
    required String phoneNumber,
    required String password,
    String? birthDate,
  }) async {
    final client = _client();
    try {
      final request = await client.postUrl(Uri.parse('$apiBaseUrl/auth/register'));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({
        'name': name,
        'phoneNumber': phoneNumber,
        'password': password,
        if (birthDate != null && birthDate.isNotEmpty) 'birthDate': birthDate,
      }));
      final response = await request.close().timeout(const Duration(seconds: 15));
      if (response.statusCode == HttpStatus.created) {
        final payload = await response.transform(utf8.decoder).join();
        final json = jsonDecode(payload) as Map<String, dynamic>;
        return (json['data'] as Map<String, dynamic>)['memberId'] as String;
      }
      // 409: duplicate phone → null
      return null;
    } catch (_) {
      return null;
    } finally {
      client.close(force: true);
    }
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

  Future<List<MemberNotification>> fetchNotifications({
    required String memberId,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/me/notifications?memberId=$memberId');
    final client = _client();

    try {
      final request = await client.getUrl(uri);
      final response =
          await request.close().timeout(const Duration(seconds: 15));

      if (response.statusCode != HttpStatus.ok) {
        return const [];
      }

      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return (json['data'] as List<dynamic>)
          .map((item) =>
              MemberNotification.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return const [];
    } finally {
      client.close(force: true);
    }
  }

  Future<List<MemberDirectoryItem>> fetchMemberDirectory({
    required String clubId,
    required String memberId,
  }) async {
    final uri =
        Uri.parse('$apiBaseUrl/clubs/$clubId/member-app/$memberId/members');
    final client = _client();

    try {
      final request = await client.getUrl(uri);
      final response =
          await request.close().timeout(const Duration(seconds: 15));

      if (response.statusCode != HttpStatus.ok) {
        throw Exception('HTTP ${response.statusCode}');
      }

      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return (json['data'] as List<dynamic>)
          .map((item) =>
              MemberDirectoryItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> markNotificationRead({
    required String memberId,
    required String notificationId,
  }) {
    return _sendJson(
      'PATCH',
      Uri.parse('$apiBaseUrl/me/notifications/$notificationId/read'),
      {'memberId': memberId},
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

  Future<bool> submitFeedback({
    required String title,
    required String body,
    required String category,
    String? memberId,
  }) {
    return _sendJson(
      'POST',
      Uri.parse('$apiBaseUrl/feedback'),
      {
        'title': title,
        'body': body,
        'category': category,
        if (memberId != null) 'memberId': memberId,
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
    return HttpClient()..connectionTimeout = const Duration(seconds: 10);
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
          await request.close().timeout(const Duration(seconds: 15));

      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}

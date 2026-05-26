import 'dart:convert';
import 'dart:io';

import 'admin_models.dart';
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

  Future<bool> resetPassword(String phoneNumber) async {
    final client = _client();
    try {
      final request = await client.postUrl(Uri.parse('$apiBaseUrl/auth/reset-password'));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({'phoneNumber': phoneNumber}));
      final response = await request.close().timeout(const Duration(seconds: 15));
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
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
      if (response.statusCode == HttpStatus.conflict) {
        // 409: duplicate phone number
        return null;
      }
      throw Exception('register failed: ${response.statusCode}');
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

  Future<Map<String, String>?> createClub({
    required String name,
    required String sportType,
    required String ownerMemberId,
  }) async {
    final client = _client();
    try {
      final request = await client.postUrl(Uri.parse('$apiBaseUrl/clubs'));
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode({
        'name': name,
        'sportType': sportType,
        'ownerMemberId': ownerMemberId,
      }));
      final response = await request.close().timeout(const Duration(seconds: 15));
      if (response.statusCode == HttpStatus.created) {
        final payload = await response.transform(utf8.decoder).join();
        final json = jsonDecode(payload) as Map<String, dynamic>;
        final data = json['data'] as Map<String, dynamic>;
        return {
          'clubId': data['clubId'] as String,
          'name': data['name'] as String,
          'sportType': data['sportType'] as String,
        };
      }
      return null;
    } catch (_) {
      return null;
    } finally {
      client.close(force: true);
    }
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

<<<<<<< HEAD
  Future<bool> createEvent({
    required String clubId,
    required String callerRole,
=======
  Future<AdminClubOverview?> fetchAdminOverview({
    required String clubId,
    required String role,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/clubs/$clubId/admin/overview');
    final client = _client();
    try {
      final request = await client.getUrl(uri);
      request.headers.set('x-crewith-role', role);
      final response = await request.close().timeout(const Duration(seconds: 15));
      if (response.statusCode != HttpStatus.ok) return null;
      final payload = await response.transform(utf8.decoder).join();
      final json = jsonDecode(payload) as Map<String, dynamic>;
      return AdminClubOverview.fromJson(json['data'] as Map<String, dynamic>);
    } catch (_) {
      return null;
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> adminCreateMember({
    required String clubId,
    required String role,
    required String name,
    required String phoneNumber,
    required String memberRole,
    String? password,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/members'), {
        'name': name,
        'phoneNumber': phoneNumber,
        'role': memberRole,
        if (password != null && password.isNotEmpty) 'password': password,
      }, role);

  Future<bool> adminUpdateMember({
    required String clubId,
    required String role,
    required String memberId,
    required String memberRole,
    required String memberStatus,
    required String lastFeeStatus,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/members/$memberId'), {
        'role': memberRole,
        'memberStatus': memberStatus,
        'lastFeeStatus': lastFeeStatus,
      }, role);

  Future<bool> adminRemoveMember({
    required String clubId,
    required String role,
    required String memberId,
  }) =>
      _deleteAdmin(Uri.parse('$apiBaseUrl/clubs/$clubId/members/$memberId'), role);

  Future<bool> adminResetMemberPassword({
    required String clubId,
    required String role,
    required String memberId,
    required String password,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/members/$memberId/password'), {
        'password': password,
      }, role);

  Future<bool> adminCreateFee({
    required String clubId,
    required String role,
    required String title,
    required String feeType,
    required int amount,
    required String dueDate,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/fees'), {
        'title': title,
        'feeType': feeType,
        'amount': amount,
        'dueDate': dueDate,
      }, role);

  Future<bool> adminUpdateFeePayment({
    required String clubId,
    required String role,
    required String feeId,
    required String memberId,
    required String status,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/fees/$feeId/payments'), {
        'memberId': memberId,
        'status': status,
      }, role);

  Future<bool> adminCreateEvent({
    required String clubId,
    required String role,
>>>>>>> 69a2eeefb81e6222a94f74d4e57aeef704a44c2e
    required String title,
    required String startsAt,
    required String locationName,
    String? locationAddress,
<<<<<<< HEAD
    String visibility = 'all_members',
  }) {
    return _sendJsonWithRole(
      'POST',
      Uri.parse('$apiBaseUrl/clubs/$clubId/events'),
      {
=======
    required String visibility,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/events'), {
>>>>>>> 69a2eeefb81e6222a94f74d4e57aeef704a44c2e
        'title': title,
        'startsAt': startsAt,
        'locationName': locationName,
        if (locationAddress != null && locationAddress.isNotEmpty)
          'locationAddress': locationAddress,
        'visibility': visibility,
<<<<<<< HEAD
      },
      callerRole,
    );
  }

  Future<bool> createMember({
    required String clubId,
    required String callerRole,
    required String name,
    required String phoneNumber,
    String role = 'member',
    String? password,
  }) {
    return _sendJsonWithRole(
      'POST',
      Uri.parse('$apiBaseUrl/clubs/$clubId/members'),
      {
        'name': name,
        'phoneNumber': phoneNumber,
        'role': role,
        if (password != null && password.isNotEmpty) 'password': password,
      },
      callerRole,
    );
  }
=======
      }, role);

  Future<bool> adminUpdateEvent({
    required String clubId,
    required String role,
    required String eventId,
    required String title,
    required String startsAt,
    required String locationName,
    String? locationAddress,
    required String visibility,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/events/$eventId'), {
        'title': title,
        'startsAt': startsAt,
        'locationName': locationName,
        if (locationAddress != null && locationAddress.isNotEmpty)
          'locationAddress': locationAddress,
        'visibility': visibility,
      }, role);

  Future<bool> adminDeleteEvent({
    required String clubId,
    required String role,
    required String eventId,
  }) =>
      _deleteAdmin(Uri.parse('$apiBaseUrl/clubs/$clubId/events/$eventId'), role);

  Future<bool> adminUpdateAttendance({
    required String clubId,
    required String role,
    required String eventId,
    required String memberId,
    required String status,
    required int companionCount,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/events/$eventId/attendance'), {
        'memberId': memberId,
        'status': status,
        'companionCount': companionCount,
      }, role);

  Future<bool> adminCreateNotice({
    required String clubId,
    required String role,
    required String title,
    required String body,
    required String visibility,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/notices'), {
        'title': title,
        'body': body,
        'visibility': visibility,
      }, role);

  Future<bool> adminUpdateNotice({
    required String clubId,
    required String role,
    required String noticeId,
    required String title,
    required String body,
    required String visibility,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/notices/$noticeId'), {
        'title': title,
        'body': body,
        'visibility': visibility,
      }, role);

  Future<bool> adminDeleteNotice({
    required String clubId,
    required String role,
    required String noticeId,
  }) =>
      _deleteAdmin(Uri.parse('$apiBaseUrl/clubs/$clubId/notices/$noticeId'), role);

  Future<bool> adminReviewJoinRequest({
    required String clubId,
    required String role,
    required String requestId,
    required String status,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/join-requests/$requestId'), {
        'status': status,
      }, role);

  Future<bool> adminCreateInviteLink({
    required String clubId,
    required String role,
    required int expiresInDays,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/invite-links'), {
        'expiresInDays': expiresInDays,
      }, role);

  Future<bool> adminDisableInviteLink({
    required String clubId,
    required String role,
    required String inviteId,
  }) =>
      _sendJsonAdmin(
          'PATCH', Uri.parse('$apiBaseUrl/clubs/$clubId/invite-links/$inviteId/disable'), {}, role);

  Future<bool> adminSendReminder({
    required String clubId,
    required String role,
    required String reminderId,
  }) =>
      _sendJsonAdmin('POST', Uri.parse('$apiBaseUrl/clubs/$clubId/reminders/send'), {
        'reminderId': reminderId,
      }, role);
>>>>>>> 69a2eeefb81e6222a94f74d4e57aeef704a44c2e

  HttpClient _client() {
    return HttpClient()..connectionTimeout = const Duration(seconds: 10);
  }

  Future<bool> _sendJsonWithRole(
    String method,
    Uri uri,
    Map<String, Object?> body,
    String role,
  ) async {
    final client = _client();
    try {
      final request = switch (method) {
        'PATCH' => await client.patchUrl(uri),
        'POST' => await client.postUrl(uri),
        _ => await client.postUrl(uri),
      };
      request.headers.contentType = ContentType.json;
      request.headers.set('x-crewith-role', role);
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

  Future<bool> _sendJsonAdmin(
    String method,
    Uri uri,
    Map<String, Object?> body,
    String role,
  ) async {
    final client = _client();
    try {
      final request = switch (method) {
        'PATCH' => await client.patchUrl(uri),
        'POST' => await client.postUrl(uri),
        _ => await client.postUrl(uri),
      };
      request.headers.contentType = ContentType.json;
      request.headers.set('x-crewith-role', role);
      request.write(jsonEncode(body));
      final response = await request.close().timeout(const Duration(seconds: 15));
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }

  Future<bool> _deleteAdmin(Uri uri, String role) async {
    final client = _client();
    try {
      final request = await client.deleteUrl(uri);
      request.headers.set('x-crewith-role', role);
      final response = await request.close().timeout(const Duration(seconds: 15));
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}

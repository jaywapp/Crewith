import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class HomePage extends StatelessWidget {
  const HomePage({
    super.key,
    required this.overview,
    required this.clubs,
    required this.activeClubId,
    required this.onClubChanged,
  });

  final MemberAppOverview overview;
  final List<ClubSummary> clubs;
  final String activeClubId;
  final ValueChanged<String> onClubChanged;

  @override
  Widget build(BuildContext context) {
    final nextEvent = overview.events.isNotEmpty ? overview.events.first : null;
    final unpaidCount =
        overview.fees.where((fee) => fee.status == 'unpaid').length;
    final unreadCount = overview.notices.where((notice) => !notice.read).length;
    final activeClub = clubs.isNotEmpty
        ? clubs.firstWhere(
            (c) => c.clubId == activeClubId,
            orElse: () => clubs.first,
          )
        : null;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: starbucksGreen,
              foregroundColor: white,
              child: Text(
                overview.clubName.characters.isNotEmpty
                    ? overview.clubName.characters.first
                    : '',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  overview.clubName,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: starbucksGreen,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                Text(
                  activeClub != null
                      ? '${overview.memberName} · ${activeClub.sportType}'
                      : overview.memberName,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: textBlackSoft),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: activeClubId,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            labelText: '내 모임',
          ),
          items: clubs
              .map(
                (club) => DropdownMenuItem(
                  value: club.clubId,
                  child: Text('${club.name} · ${club.sportType}'),
                ),
              )
              .toList(),
          onChanged: clubs.length <= 1
              ? null
              : (value) {
                  if (value != null) {
                    onClubChanged(value);
                  }
                },
        ),
        const SizedBox(height: 24),
        if (nextEvent != null)
          SummaryCard(
            label: '🏃 다음 일정',
            title: nextEvent.title,
            body: '${formatDate(nextEvent.startsAt)} · ${nextEvent.locationName}',
          ),
        const SizedBox(height: 12),
        SummaryCard(
          label: '💰 내 회비',
          title: unpaidCount == 0 ? '미납 없음' : '미납 $unpaidCount건',
          body: unpaidCount == 0
              ? '현재 확인이 필요한 회비가 없습니다.'
              : '운영진이 납부 상태를 확인하면 반영됩니다.',
        ),
        const SizedBox(height: 12),
        SummaryCard(
          label: '📢 미확인 공지',
          title: '$unreadCount건',
          body: unreadCount == 0 ? '모든 공지를 확인했습니다.' : '공지 탭에서 열람하면 확인 처리됩니다.',
        ),
      ],
    );
  }
}

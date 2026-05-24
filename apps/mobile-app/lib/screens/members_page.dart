import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class MembersPage extends StatelessWidget {
  const MembersPage({super.key, required this.members});

  final List<MemberDirectoryItem> members;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '👥 구성원',
      subtitle: '모임 구성원과 공개된 연락처 정보를 확인합니다.',
      children: [
        if (members.isEmpty) const InfoCard(child: Text('표시할 구성원이 없습니다.')),
        ...members.map(
          (member) => InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      backgroundColor: greenLight,
                      foregroundColor: houseGreen,
                      backgroundImage: _imageProvider(member.profileImageUrl),
                      child: member.profileImageUrl == null
                          ? Text(member.name.characters.first)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            member.name,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(
                                  color: houseGreen,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                              '${roleLabel(member.role)} · ${memberStatusLabel(member.memberStatus)}'),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    InfoChip(label: '🗓 가입 ${member.joinedAt}'),
                    if (member.phoneNumber != null)
                      InfoChip(label: member.phoneNumber!),
                    if (member.birthDate != null)
                      InfoChip(label: '생년월일 ${member.birthDate}'),
                    if (member.gender != null)
                      InfoChip(label: genderLabel(member.gender)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

ImageProvider? _imageProvider(String? imageUrl) {
  if (imageUrl == null || imageUrl.isEmpty) {
    return null;
  }

  return NetworkImage(imageUrl);
}

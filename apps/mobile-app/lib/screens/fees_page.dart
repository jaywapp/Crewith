import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class FeesPage extends StatelessWidget {
  const FeesPage({super.key, required this.overview});

  final MemberAppOverview overview;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '회비',
      subtitle: '내 납부 상태를 확인하세요.',
      children: overview.fees.map((fee) {
        return InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(label: fee.dueDate, title: fee.title),
              Text('${formatCurrency(fee.amount)}원'),
              const SizedBox(height: 12),
              StatusPill(label: feeLabel(fee.status), status: fee.status),
            ],
          ),
        );
      }).toList(),
    );
  }
}

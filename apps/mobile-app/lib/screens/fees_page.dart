import 'package:flutter/material.dart';

import '../member_models.dart';
import '../member_ui.dart';

class FeesPage extends StatelessWidget {
  const FeesPage({super.key, required this.overview});

  final MemberAppOverview overview;

  @override
  Widget build(BuildContext context) {
    return PageScaffold(
      title: '💰 회비',
      subtitle: '내 납부 상태를 확인하세요.',
      children: overview.fees.map((fee) {
        return InfoCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fee.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            color: houseGreen,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${formatCurrency(fee.amount)}원 · ${fee.dueDate}',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: textBlackSoft),
                    ),
                  ],
                ),
              ),
              StatusPill(label: feeLabel(fee.status), status: fee.status),
            ],
          ),
        );
      }).toList(),
    );
  }
}

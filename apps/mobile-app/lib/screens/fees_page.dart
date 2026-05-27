import 'package:flutter/material.dart';

import '../member_api_client.dart';
import '../member_models.dart';
import '../member_ui.dart';

class FeesPage extends StatelessWidget {
  const FeesPage({
    super.key,
    required this.overview,
    this.isAdmin = false,
    this.clubId,
    this.role,
    this.api,
    this.onRefresh,
  });

  final MemberAppOverview overview;
  final bool isAdmin;
  final String? clubId;
  final String? role;
  final MemberApiClient? api;
  final VoidCallback? onRefresh;

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _FeeFormSheet(
        clubId: clubId!,
        role: role!,
        api: api!,
        onSuccess: () {
          Navigator.of(context).pop();
          onRefresh?.call();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final feeCards = overview.fees.map((fee) {
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
    }).toList();

    final pageContent = PageScaffold(
      title: '💰 회비',
      subtitle: isAdmin ? '회비 항목을 관리하세요.' : '내 납부 상태를 확인하세요.',
      children: [
        ...feeCards,
        if (isAdmin) const SizedBox(height: 72),
      ],
    );

    if (!isAdmin) return pageContent;

    return Stack(
      children: [
        pageContent,
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton.extended(
            heroTag: 'fees-fab',
            onPressed: () => _showCreateSheet(context),
            backgroundColor: greenAccent,
            foregroundColor: white,
            icon: const Icon(Icons.add),
            label: const Text('회비 추가'),
          ),
        ),
      ],
    );
  }
}

// ─── Fee Form Sheet ───────────────────────────────────────────────────────────

class _FeeFormSheet extends StatefulWidget {
  const _FeeFormSheet({
    required this.clubId,
    required this.role,
    required this.api,
    required this.onSuccess,
  });

  final String clubId;
  final String role;
  final MemberApiClient api;
  final VoidCallback onSuccess;

  @override
  State<_FeeFormSheet> createState() => _FeeFormSheetState();
}

class _FeeFormSheetState extends State<_FeeFormSheet> {
  final _titleCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _dueDateCtrl = TextEditingController();
  String _feeType = 'recurring';
  bool _saving = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _amountCtrl.dispose();
    _dueDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_titleCtrl.text.trim().isEmpty ||
        _amountCtrl.text.trim().isEmpty ||
        _dueDateCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('항목명, 금액, 납부일을 입력하세요.')),
      );
      return;
    }
    final amount = int.tryParse(_amountCtrl.text.trim());
    if (amount == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('금액은 숫자로 입력하세요.')),
      );
      return;
    }

    setState(() => _saving = true);
    final ok = await widget.api.adminCreateFee(
      clubId: widget.clubId,
      role: widget.role,
      title: _titleCtrl.text.trim(),
      feeType: _feeType,
      amount: amount,
      dueDate: _dueDateCtrl.text.trim(),
    );

    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('회비 추가에 실패했습니다.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
        top: 20,
        left: 16,
        right: 16,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '💰 회비 추가',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: houseGreen,
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 16),
            TextInput(controller: _titleCtrl, label: '항목명'),
            TextInput(
              controller: _amountCtrl,
              label: '금액',
              keyboardType: TextInputType.number,
            ),
            TextInput(
              controller: _dueDateCtrl,
              label: '납부일 (YYYY-MM-DD)',
              hint: '2026-06-30',
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: DropdownButtonFormField<String>(
                value: _feeType,
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  labelText: '유형',
                ),
                items: const [
                  DropdownMenuItem(value: 'recurring', child: Text('월회비')),
                  DropdownMenuItem(value: 'one_time', child: Text('일회성')),
                ],
                onChanged: (v) {
                  if (v != null) setState(() => _feeType = v);
                },
              ),
            ),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: const Text('회비 추가'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

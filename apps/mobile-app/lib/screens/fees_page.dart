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

  void _showEditSheet(BuildContext context, MemberFee fee) {
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
        initialFee: fee,
        onSuccess: () {
          Navigator.of(context).pop();
          onRefresh?.call();
        },
      ),
    );
  }

  Future<void> _deleteFee(BuildContext context, MemberFee fee) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('회비 삭제'),
        content: Text('"${fee.title}" 회비를 삭제하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('취소'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('삭제'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await api!.adminDeleteFee(
      clubId: clubId!,
      role: role!,
      feeId: fee.id,
    );
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ok ? '회비를 삭제했습니다.' : '삭제에 실패했습니다.')),
    );
    if (ok) onRefresh?.call();
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
            if (isAdmin)
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert),
                onSelected: (action) {
                  if (action == 'edit') _showEditSheet(context, fee);
                  if (action == 'delete') _deleteFee(context, fee);
                },
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'edit', child: Text('수정')),
                  PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      '삭제',
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              ),
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
    this.initialFee,
  });

  final String clubId;
  final String role;
  final MemberApiClient api;
  final VoidCallback onSuccess;
  final MemberFee? initialFee;

  @override
  State<_FeeFormSheet> createState() => _FeeFormSheetState();
}

class _FeeFormSheetState extends State<_FeeFormSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _amountCtrl;
  late final TextEditingController _dueDateCtrl;
  String _feeType = 'recurring';
  bool _saving = false;

  bool get _isEdit => widget.initialFee != null;

  @override
  void initState() {
    super.initState();
    final fee = widget.initialFee;
    _titleCtrl = TextEditingController(text: fee?.title ?? '');
    _amountCtrl = TextEditingController(text: fee != null ? '${fee.amount}' : '');
    _dueDateCtrl = TextEditingController(text: fee?.dueDate ?? '');
  }

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
    final bool ok;
    if (_isEdit) {
      ok = await widget.api.adminUpdateFee(
        clubId: widget.clubId,
        role: widget.role,
        feeId: widget.initialFee!.id,
        title: _titleCtrl.text.trim(),
        amount: amount,
        dueDate: _dueDateCtrl.text.trim(),
      );
    } else {
      ok = await widget.api.adminCreateFee(
        clubId: widget.clubId,
        role: widget.role,
        title: _titleCtrl.text.trim(),
        feeType: _feeType,
        amount: amount,
        dueDate: _dueDateCtrl.text.trim(),
      );
    }

    if (!mounted) return;
    setState(() => _saving = false);

    if (ok) {
      widget.onSuccess();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isEdit ? '수정에 실패했습니다.' : '회비 추가에 실패했습니다.')),
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
              _isEdit ? '✏️ 회비 수정' : '💰 회비 추가',
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
            if (!_isEdit)
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
            if (_isEdit) const SizedBox(height: 4),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_isEdit ? '수정 저장' : '회비 추가'),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

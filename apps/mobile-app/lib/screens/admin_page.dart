import 'package:flutter/material.dart';

import '../admin_models.dart';
import '../member_api_client.dart';
import '../member_ui.dart';

class AdminPage extends StatefulWidget {
  const AdminPage({
    super.key,
    required this.clubId,
    required this.role,
    required this.api,
  });

  final String clubId;
  final String role;
  final MemberApiClient api;

  @override
  State<AdminPage> createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Future<AdminClubOverview?> _overviewFuture;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _refresh();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _refresh() {
    setState(() {
      _overviewFuture = widget.api.fetchAdminOverview(
        clubId: widget.clubId,
        role: widget.role,
      );
    });
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _onAction(String message) {
    _showSnack(message);
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('관리자 모드'),
        backgroundColor: starbucksGreen,
        foregroundColor: white,
        bottom: TabBar(
          controller: _tabController,
          labelColor: white,
          unselectedLabelColor: greenLight,
          indicatorColor: white,
          isScrollable: true,
          tabs: const [
            Tab(text: '회원'),
            Tab(text: '회비'),
            Tab(text: '일정'),
            Tab(text: '공지'),
            Tab(text: '가입/초대'),
            Tab(text: '알림'),
          ],
        ),
      ),
      body: FutureBuilder<AdminClubOverview?>(
        future: _overviewFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || snapshot.data == null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('관리자 데이터를 불러오지 못했습니다.'),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: _refresh, child: const Text('다시 시도')),
                ],
              ),
            );
          }
          final overview = snapshot.data!;
          return TabBarView(
            controller: _tabController,
            children: [
              _MembersTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
              _FeesTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
              _EventsTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
              _NoticesTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
              _JoinTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
              _RemindersTab(
                overview: overview,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: _onAction,
              ),
            ],
          );
        },
      ),
    );
  }
}

// ─── Members Tab ────────────────────────────────────────────────────────────

class _MembersTab extends StatefulWidget {
  const _MembersTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_MembersTab> createState() => _MembersTabState();
}

class _MembersTabState extends State<_MembersTab> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  String _newMemberRole = 'member';
  bool _creating = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _createMember() async {
    if (_nameCtrl.text.trim().isEmpty || _phoneCtrl.text.trim().isEmpty) {
      widget.onAction('이름과 휴대폰 번호를 입력하세요.');
      return;
    }
    setState(() => _creating = true);
    final ok = await widget.api.adminCreateMember(
      clubId: widget.clubId,
      role: widget.role,
      name: _nameCtrl.text.trim(),
      phoneNumber: _phoneCtrl.text.trim(),
      memberRole: _newMemberRole,
      password: _passwordCtrl.text.trim().isEmpty ? null : _passwordCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _creating = false);
    widget.onAction(ok ? '회원을 추가했습니다.' : '회원 추가에 실패했습니다.');
    if (ok) {
      _nameCtrl.clear();
      _phoneCtrl.clear();
      _passwordCtrl.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '회원 관리', title: '회원 추가'),
              TextInput(controller: _nameCtrl, label: '이름'),
              TextInput(
                controller: _phoneCtrl,
                label: '휴대폰 번호',
                keyboardType: TextInputType.phone,
              ),
              TextInput(controller: _passwordCtrl, label: '초기 비밀번호 (미입력 시 전화번호 뒤 4자리)'),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<String>(
                  value: _newMemberRole,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '역할',
                  ),
                  items: const [
                    DropdownMenuItem(value: 'member', child: Text('일반회원')),
                    DropdownMenuItem(value: 'operator', child: Text('운영진')),
                    DropdownMenuItem(value: 'owner', child: Text('모임장')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _newMemberRole = v); },
                ),
              ),
              FilledButton(
                onPressed: _creating ? null : _createMember,
                child: const Text('회원 추가'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label: '회원 목록',
                title: '${widget.overview.members.length}명',
              ),
              ...widget.overview.members.map((member) =>
                _MemberRow(
                  member: member,
                  clubId: widget.clubId,
                  role: widget.role,
                  api: widget.api,
                  onAction: widget.onAction,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MemberRow extends StatefulWidget {
  const _MemberRow({
    required this.member,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminMember member;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_MemberRow> createState() => _MemberRowState();
}

class _MemberRowState extends State<_MemberRow> {
  late String _memberRole;
  late String _memberStatus;
  late String _feeStatus;
  final _pwCtrl = TextEditingController();
  bool _saving = false;
  bool _removing = false;
  bool _resetting = false;

  @override
  void initState() {
    super.initState();
    _memberRole = widget.member.role;
    _memberStatus = widget.member.memberStatus;
    _feeStatus = widget.member.lastFeeStatus;
  }

  @override
  void dispose() {
    _pwCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.api.adminUpdateMember(
      clubId: widget.clubId,
      role: widget.role,
      memberId: widget.member.id,
      memberRole: _memberRole,
      memberStatus: _memberStatus,
      lastFeeStatus: _feeStatus,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    widget.onAction(ok ? '저장했습니다.' : '저장에 실패했습니다.');
  }

  Future<void> _remove() async {
    setState(() => _removing = true);
    final ok = await widget.api.adminRemoveMember(
      clubId: widget.clubId,
      role: widget.role,
      memberId: widget.member.id,
    );
    if (!mounted) return;
    setState(() => _removing = false);
    widget.onAction(ok ? '회원을 삭제했습니다.' : '삭제에 실패했습니다.');
  }

  Future<void> _resetPassword() async {
    if (_pwCtrl.text.trim().isEmpty) {
      widget.onAction('새 비밀번호를 입력하세요.');
      return;
    }
    setState(() => _resetting = true);
    final ok = await widget.api.adminResetMemberPassword(
      clubId: widget.clubId,
      role: widget.role,
      memberId: widget.member.id,
      password: _pwCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _resetting = false);
    widget.onAction(ok ? '비밀번호를 재설정했습니다.' : '재설정에 실패했습니다.');
    if (ok) _pwCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          Text(
            widget.member.name,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          Text(
            '${widget.member.phoneNumber} · 가입 ${widget.member.joinedAt}',
            style: TextStyle(color: textBlackSoft, fontSize: 12),
          ),
          if (widget.member.personalDataDeleteAt != null)
            Text(
              '개인정보 삭제 예정 ${widget.member.personalDataDeleteAt}',
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _memberRole,
                  isDense: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '역할',
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'member', child: Text('일반회원')),
                    DropdownMenuItem(value: 'operator', child: Text('운영진')),
                    DropdownMenuItem(value: 'owner', child: Text('모임장')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _memberRole = v); },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _memberStatus,
                  isDense: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '상태',
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'active', child: Text('활성')),
                    DropdownMenuItem(value: 'dormant', child: Text('휴면')),
                    DropdownMenuItem(value: 'left', child: Text('탈퇴')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _memberStatus = v); },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _feeStatus,
                  isDense: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '회비',
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'unpaid', child: Text('미납')),
                    DropdownMenuItem(value: 'paid', child: Text('납부')),
                    DropdownMenuItem(value: 'exempt', child: Text('면제')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _feeStatus = v); },
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _saving ? null : _save,
                child: const Text('저장'),
              ),
              const SizedBox(width: 4),
              OutlinedButton(
                onPressed: _removing ? null : _remove,
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('삭제'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _pwCtrl,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '새 비밀번호',
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _resetting ? null : _resetPassword,
                child: const Text('재설정'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Fees Tab ───────────────────────────────────────────────────────────────

class _FeesTab extends StatefulWidget {
  const _FeesTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_FeesTab> createState() => _FeesTabState();
}

class _FeesTabState extends State<_FeesTab> {
  final _titleCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _dueDateCtrl = TextEditingController();
  String _feeType = 'recurring';
  bool _creating = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _amountCtrl.dispose();
    _dueDateCtrl.dispose();
    super.dispose();
  }

  Future<void> _createFee() async {
    if (_titleCtrl.text.trim().isEmpty || _amountCtrl.text.trim().isEmpty || _dueDateCtrl.text.trim().isEmpty) {
      widget.onAction('항목명, 금액, 납부일을 입력하세요.');
      return;
    }
    final amount = int.tryParse(_amountCtrl.text.trim());
    if (amount == null) {
      widget.onAction('금액은 숫자로 입력하세요.');
      return;
    }
    setState(() => _creating = true);
    final ok = await widget.api.adminCreateFee(
      clubId: widget.clubId,
      role: widget.role,
      title: _titleCtrl.text.trim(),
      feeType: _feeType,
      amount: amount,
      dueDate: _dueDateCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _creating = false);
    widget.onAction(ok ? '회비 항목을 추가했습니다.' : '회비 추가에 실패했습니다.');
    if (ok) {
      _titleCtrl.clear();
      _amountCtrl.clear();
      _dueDateCtrl.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '회비 관리', title: '회비 항목 생성'),
              TextInput(controller: _titleCtrl, label: '항목명'),
              TextInput(
                controller: _amountCtrl,
                label: '금액',
                keyboardType: TextInputType.number,
              ),
              TextInput(controller: _dueDateCtrl, label: '납부일 (YYYY-MM-DD)'),
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
                  onChanged: (v) { if (v != null) setState(() => _feeType = v); },
                ),
              ),
              FilledButton(
                onPressed: _creating ? null : _createFee,
                child: const Text('회비 추가'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...widget.overview.fees.map((fee) =>
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _FeeCard(
              fee: fee,
              clubId: widget.clubId,
              role: widget.role,
              api: widget.api,
              onAction: widget.onAction,
            ),
          ),
        ),
      ],
    );
  }
}

class _FeeCard extends StatelessWidget {
  const _FeeCard({
    required this.fee,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminFee fee;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardHeader(
            label: fee.feeType == 'recurring' ? '월회비' : '일회성',
            title: fee.title,
          ),
          Text(
            '${formatCurrency(fee.amount)}원 · ${fee.dueDate}까지 · 수납률 ${fee.collectionRate}%',
            style: TextStyle(color: textBlackSoft, fontSize: 13),
          ),
          Text(
            '대상 ${fee.targetCount}명 · 납부 ${fee.paidCount}명 · 미납 ${fee.unpaidCount}명',
            style: TextStyle(color: textBlackSoft, fontSize: 12),
          ),
          const SizedBox(height: 8),
          ...fee.payments.map((payment) =>
            _FeePaymentRow(
              payment: payment,
              feeId: fee.id,
              clubId: clubId,
              role: role,
              api: api,
              onAction: onAction,
            ),
          ),
        ],
      ),
    );
  }
}

class _FeePaymentRow extends StatefulWidget {
  const _FeePaymentRow({
    required this.payment,
    required this.feeId,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminFeePayment payment;
  final String feeId;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_FeePaymentRow> createState() => _FeePaymentRowState();
}

class _FeePaymentRowState extends State<_FeePaymentRow> {
  late String _status;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.payment.status;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.api.adminUpdateFeePayment(
      clubId: widget.clubId,
      role: widget.role,
      feeId: widget.feeId,
      memberId: widget.payment.memberId,
      status: _status,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    widget.onAction(ok ? '납부 상태를 저장했습니다.' : '저장에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(widget.payment.memberName),
          ),
          DropdownButton<String>(
            value: _status,
            isDense: true,
            items: const [
              DropdownMenuItem(value: 'unpaid', child: Text('미납')),
              DropdownMenuItem(value: 'paid', child: Text('납부')),
              DropdownMenuItem(value: 'exempt', child: Text('면제')),
            ],
            onChanged: (v) { if (v != null) setState(() => _status = v); },
          ),
          const SizedBox(width: 8),
          SizedBox(
            height: 32,
            child: OutlinedButton(
              onPressed: _saving ? null : _save,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10),
              ),
              child: const Text('저장', style: TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Events Tab ─────────────────────────────────────────────────────────────

class _EventsTab extends StatefulWidget {
  const _EventsTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_EventsTab> createState() => _EventsTabState();
}

class _EventsTabState extends State<_EventsTab> {
  final _titleCtrl = TextEditingController();
  final _startsAtCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  String _visibility = 'all_members';
  bool _creating = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _startsAtCtrl.dispose();
    _locationCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _createEvent() async {
    if (_titleCtrl.text.trim().isEmpty ||
        _startsAtCtrl.text.trim().isEmpty ||
        _locationCtrl.text.trim().isEmpty) {
      widget.onAction('일정명, 일시, 장소를 입력하세요.');
      return;
    }
    setState(() => _creating = true);
    final ok = await widget.api.adminCreateEvent(
      clubId: widget.clubId,
      role: widget.role,
      title: _titleCtrl.text.trim(),
      startsAt: _startsAtCtrl.text.trim(),
      locationName: _locationCtrl.text.trim(),
      locationAddress: _addressCtrl.text.trim(),
      visibility: _visibility,
    );
    if (!mounted) return;
    setState(() => _creating = false);
    widget.onAction(ok ? '일정을 추가했습니다.' : '일정 추가에 실패했습니다.');
    if (ok) {
      _titleCtrl.clear();
      _startsAtCtrl.clear();
      _locationCtrl.clear();
      _addressCtrl.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '일정/출석', title: '일정 생성'),
              TextInput(controller: _titleCtrl, label: '일정명'),
              TextInput(
                controller: _startsAtCtrl,
                label: '일시 (YYYY-MM-DDTHH:MM)',
                hint: '2026-06-01T10:00',
              ),
              TextInput(controller: _locationCtrl, label: '장소'),
              TextInput(controller: _addressCtrl, label: '주소 (선택)'),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<String>(
                  value: _visibility,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '공개 범위',
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all_members', child: Text('전체 회원')),
                    DropdownMenuItem(value: 'operators_only', child: Text('운영진만')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _visibility = v); },
                ),
              ),
              FilledButton(
                onPressed: _creating ? null : _createEvent,
                child: const Text('일정 추가'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...widget.overview.events.map((event) =>
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _EventCard(
              event: event,
              clubId: widget.clubId,
              role: widget.role,
              api: widget.api,
              onAction: widget.onAction,
            ),
          ),
        ),
      ],
    );
  }
}

class _EventCard extends StatefulWidget {
  const _EventCard({
    required this.event,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminEvent event;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_EventCard> createState() => _EventCardState();
}

class _EventCardState extends State<_EventCard> {
  late TextEditingController _titleCtrl;
  late TextEditingController _startsAtCtrl;
  late TextEditingController _locationCtrl;
  late TextEditingController _addressCtrl;
  late String _visibility;
  bool _saving = false;
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.event.title);
    _startsAtCtrl = TextEditingController(
      text: widget.event.startsAt.length >= 16 ? widget.event.startsAt.substring(0, 16) : widget.event.startsAt,
    );
    _locationCtrl = TextEditingController(text: widget.event.locationName);
    _addressCtrl = TextEditingController(text: widget.event.locationAddress ?? '');
    _visibility = widget.event.visibility;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _startsAtCtrl.dispose();
    _locationCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.api.adminUpdateEvent(
      clubId: widget.clubId,
      role: widget.role,
      eventId: widget.event.id,
      title: _titleCtrl.text.trim(),
      startsAt: _startsAtCtrl.text.trim(),
      locationName: _locationCtrl.text.trim(),
      locationAddress: _addressCtrl.text.trim(),
      visibility: _visibility,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    widget.onAction(ok ? '일정을 수정했습니다.' : '수정에 실패했습니다.');
  }

  Future<void> _delete() async {
    setState(() => _deleting = true);
    final ok = await widget.api.adminDeleteEvent(
      clubId: widget.clubId,
      role: widget.role,
      eventId: widget.event.id,
    );
    if (!mounted) return;
    setState(() => _deleting = false);
    widget.onAction(ok ? '일정을 삭제했습니다.' : '삭제에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardHeader(
            label: widget.event.visibility == 'operators_only' ? '운영진만' : '전체 회원',
            title: widget.event.title,
          ),
          Text(
            '${formatDate(widget.event.startsAt)} · ${widget.event.locationName}',
            style: TextStyle(color: textBlackSoft, fontSize: 13),
          ),
          Text(
            '참석예정 ${widget.event.attendingCount}명 · 출석 ${widget.event.presentCount}명 · 지각 ${widget.event.lateCount}명 · 결석 ${widget.event.absentCount}명',
            style: TextStyle(color: textBlackSoft, fontSize: 12),
          ),
          const SizedBox(height: 8),
          TextInput(controller: _titleCtrl, label: '일정명'),
          TextInput(controller: _startsAtCtrl, label: '일시'),
          TextInput(controller: _locationCtrl, label: '장소'),
          TextInput(controller: _addressCtrl, label: '주소'),
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: DropdownButtonFormField<String>(
              value: _visibility,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: '공개 범위',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              items: const [
                DropdownMenuItem(value: 'all_members', child: Text('전체 회원')),
                DropdownMenuItem(value: 'operators_only', child: Text('운영진만')),
              ],
              onChanged: (v) { if (v != null) setState(() => _visibility = v); },
            ),
          ),
          Row(
            children: [
              OutlinedButton(
                onPressed: _saving ? null : _save,
                child: const Text('수정'),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _deleting ? null : _delete,
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('삭제'),
              ),
            ],
          ),
          if (widget.event.participants.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('출석 관리', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            ...widget.event.participants.map((p) =>
              _AttendanceRow(
                participant: p,
                eventId: widget.event.id,
                clubId: widget.clubId,
                role: widget.role,
                api: widget.api,
                onAction: widget.onAction,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AttendanceRow extends StatefulWidget {
  const _AttendanceRow({
    required this.participant,
    required this.eventId,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminEventParticipant participant;
  final String eventId;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_AttendanceRow> createState() => _AttendanceRowState();
}

class _AttendanceRowState extends State<_AttendanceRow> {
  late String _status;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _status = widget.participant.attendanceStatus;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.api.adminUpdateAttendance(
      clubId: widget.clubId,
      role: widget.role,
      eventId: widget.eventId,
      memberId: widget.participant.memberId,
      status: _status,
      companionCount: widget.participant.companionCount,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    widget.onAction(ok ? '출석을 저장했습니다.' : '저장에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(widget.participant.memberName)),
          DropdownButton<String>(
            value: _status,
            isDense: true,
            items: const [
              DropdownMenuItem(value: 'present', child: Text('출석')),
              DropdownMenuItem(value: 'late', child: Text('지각')),
              DropdownMenuItem(value: 'absent', child: Text('결석')),
            ],
            onChanged: (v) { if (v != null) setState(() => _status = v); },
          ),
          const SizedBox(width: 8),
          SizedBox(
            height: 32,
            child: OutlinedButton(
              onPressed: _saving ? null : _save,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 10),
              ),
              child: const Text('저장', style: TextStyle(fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Notices Tab ─────────────────────────────────────────────────────────────

class _NoticesTab extends StatefulWidget {
  const _NoticesTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_NoticesTab> createState() => _NoticesTabState();
}

class _NoticesTabState extends State<_NoticesTab> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  String _visibility = 'all_members';
  bool _creating = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _createNotice() async {
    if (_titleCtrl.text.trim().isEmpty || _bodyCtrl.text.trim().isEmpty) {
      widget.onAction('제목과 내용을 입력하세요.');
      return;
    }
    setState(() => _creating = true);
    final ok = await widget.api.adminCreateNotice(
      clubId: widget.clubId,
      role: widget.role,
      title: _titleCtrl.text.trim(),
      body: _bodyCtrl.text.trim(),
      visibility: _visibility,
    );
    if (!mounted) return;
    setState(() => _creating = false);
    widget.onAction(ok ? '공지를 작성했습니다.' : '공지 작성에 실패했습니다.');
    if (ok) {
      _titleCtrl.clear();
      _bodyCtrl.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '공지 관리', title: '공지 작성'),
              TextInput(controller: _titleCtrl, label: '제목'),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextField(
                  controller: _bodyCtrl,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '내용',
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<String>(
                  value: _visibility,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '공개 범위',
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all_members', child: Text('전체 회원')),
                    DropdownMenuItem(value: 'operators_only', child: Text('운영진만')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _visibility = v); },
                ),
              ),
              FilledButton(
                onPressed: _creating ? null : _createNotice,
                child: const Text('공지 작성'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        ...widget.overview.notices.map((notice) =>
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _NoticeCard(
              notice: notice,
              clubId: widget.clubId,
              role: widget.role,
              api: widget.api,
              onAction: widget.onAction,
            ),
          ),
        ),
      ],
    );
  }
}

class _NoticeCard extends StatefulWidget {
  const _NoticeCard({
    required this.notice,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminNotice notice;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_NoticeCard> createState() => _NoticeCardState();
}

class _NoticeCardState extends State<_NoticeCard> {
  late TextEditingController _titleCtrl;
  late TextEditingController _bodyCtrl;
  late String _visibility;
  bool _saving = false;
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.notice.title);
    _bodyCtrl = TextEditingController(text: widget.notice.body);
    _visibility = widget.notice.visibility;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final ok = await widget.api.adminUpdateNotice(
      clubId: widget.clubId,
      role: widget.role,
      noticeId: widget.notice.id,
      title: _titleCtrl.text.trim(),
      body: _bodyCtrl.text.trim(),
      visibility: _visibility,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    widget.onAction(ok ? '공지를 수정했습니다.' : '수정에 실패했습니다.');
  }

  Future<void> _delete() async {
    setState(() => _deleting = true);
    final ok = await widget.api.adminDeleteNotice(
      clubId: widget.clubId,
      role: widget.role,
      noticeId: widget.notice.id,
    );
    if (!mounted) return;
    setState(() => _deleting = false);
    widget.onAction(ok ? '공지를 삭제했습니다.' : '삭제에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CardHeader(
            label: widget.notice.visibility == 'operators_only' ? '운영진만' : '전체 회원',
            title: widget.notice.title,
          ),
          Text(
            '확인 ${widget.notice.readCount}명 · 미확인 ${widget.notice.unreadCount}명 · 좋아요 ${widget.notice.likeCount}',
            style: TextStyle(color: textBlackSoft, fontSize: 12),
          ),
          const SizedBox(height: 8),
          TextInput(controller: _titleCtrl, label: '제목'),
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: TextField(
              controller: _bodyCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: '내용',
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: DropdownButtonFormField<String>(
              value: _visibility,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                labelText: '공개 범위',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              items: const [
                DropdownMenuItem(value: 'all_members', child: Text('전체 회원')),
                DropdownMenuItem(value: 'operators_only', child: Text('운영진만')),
              ],
              onChanged: (v) { if (v != null) setState(() => _visibility = v); },
            ),
          ),
          Row(
            children: [
              OutlinedButton(
                onPressed: _saving ? null : _save,
                child: const Text('수정'),
              ),
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: _deleting ? null : _delete,
                style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                child: const Text('삭제'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Join/Invite Tab ─────────────────────────────────────────────────────────

class _JoinTab extends StatefulWidget {
  const _JoinTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_JoinTab> createState() => _JoinTabState();
}

class _JoinTabState extends State<_JoinTab> {
  int _expiresInDays = 30;
  bool _creatingLink = false;

  Future<void> _createInviteLink() async {
    setState(() => _creatingLink = true);
    final ok = await widget.api.adminCreateInviteLink(
      clubId: widget.clubId,
      role: widget.role,
      expiresInDays: _expiresInDays,
    );
    if (!mounted) return;
    setState(() => _creatingLink = false);
    widget.onAction(ok ? '초대 링크를 생성했습니다.' : '초대 링크 생성에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = widget.overview.joinRequests
        .where((r) => r.status == 'pending')
        .length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CardHeader(label: '비공개 모임', title: '초대 링크 생성'),
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<int>(
                  value: _expiresInDays,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: '초대 만료일',
                  ),
                  items: const [
                    DropdownMenuItem(value: 7, child: Text('7일')),
                    DropdownMenuItem(value: 30, child: Text('30일')),
                    DropdownMenuItem(value: 90, child: Text('90일')),
                  ],
                  onChanged: (v) { if (v != null) setState(() => _expiresInDays = v); },
                ),
              ),
              FilledButton(
                onPressed: _creatingLink ? null : _createInviteLink,
                child: const Text('초대 링크 생성'),
              ),
              if (widget.overview.inviteLinks.isNotEmpty) ...[
                const SizedBox(height: 12),
                ...widget.overview.inviteLinks.map((link) =>
                  _InviteLinkRow(
                    link: link,
                    clubId: widget.clubId,
                    role: widget.role,
                    api: widget.api,
                    onAction: widget.onAction,
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        InfoCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CardHeader(
                label: '공개 모임',
                title: '가입 신청 · 대기 $pendingCount건',
              ),
              if (widget.overview.joinRequests.isEmpty)
                const Text('가입 신청이 없습니다.'),
              ...widget.overview.joinRequests.map((request) =>
                _JoinRequestRow(
                  request: request,
                  clubId: widget.clubId,
                  role: widget.role,
                  api: widget.api,
                  onAction: widget.onAction,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InviteLinkRow extends StatefulWidget {
  const _InviteLinkRow({
    required this.link,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminInviteLink link;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_InviteLinkRow> createState() => _InviteLinkRowState();
}

class _InviteLinkRowState extends State<_InviteLinkRow> {
  bool _disabling = false;

  Future<void> _disable() async {
    setState(() => _disabling = true);
    final ok = await widget.api.adminDisableInviteLink(
      clubId: widget.clubId,
      role: widget.role,
      inviteId: widget.link.id,
    );
    if (!mounted) return;
    setState(() => _disabling = false);
    widget.onAction(ok ? '초대 링크를 비활성화했습니다.' : '비활성화에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.link.token,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Text(
                  '${widget.link.expiresAt}까지 · ${widget.link.disabled ? "비활성" : "활성"}',
                  style: TextStyle(color: textBlackSoft, fontSize: 12),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: (widget.link.disabled || _disabling) ? null : _disable,
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('비활성화'),
          ),
        ],
      ),
    );
  }
}

class _JoinRequestRow extends StatefulWidget {
  const _JoinRequestRow({
    required this.request,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminJoinRequest request;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_JoinRequestRow> createState() => _JoinRequestRowState();
}

class _JoinRequestRowState extends State<_JoinRequestRow> {
  bool _approving = false;
  bool _rejecting = false;

  Future<void> _review(String status) async {
    if (status == 'approved') {
      setState(() => _approving = true);
    } else {
      setState(() => _rejecting = true);
    }
    final ok = await widget.api.adminReviewJoinRequest(
      clubId: widget.clubId,
      role: widget.role,
      requestId: widget.request.id,
      status: status,
    );
    if (!mounted) return;
    setState(() { _approving = false; _rejecting = false; });
    widget.onAction(ok
        ? (status == 'approved' ? '가입을 승인했습니다.' : '가입을 거절했습니다.')
        : '처리에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    final isPending = widget.request.status == 'pending';
    final statusColor = switch (widget.request.status) {
      'approved' => greenAccent,
      'rejected' => Colors.red,
      _ => gold,
    };
    final statusLabel = switch (widget.request.status) {
      'approved' => '승인',
      'rejected' => '거절',
      _ => '대기',
    };

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Divider(),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.request.applicantName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      widget.request.applicantPhone,
                      style: TextStyle(color: textBlackSoft, fontSize: 12),
                    ),
                    Text(widget.request.greeting),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(color: statusColor, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          if (isPending) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton(
                  onPressed: _approving ? null : () => _review('approved'),
                  child: const Text('승인'),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: _rejecting ? null : () => _review('rejected'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('거절'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Reminders Tab ───────────────────────────────────────────────────────────

class _RemindersTab extends StatefulWidget {
  const _RemindersTab({
    required this.overview,
    required this.clubId,
    required this.role,
    required this.api,
    required this.onAction,
  });

  final AdminClubOverview overview;
  final String clubId;
  final String role;
  final MemberApiClient api;
  final void Function(String) onAction;

  @override
  State<_RemindersTab> createState() => _RemindersTabState();
}

class _RemindersTabState extends State<_RemindersTab> {
  final Set<String> _sending = {};

  Future<void> _sendReminder(String reminderId) async {
    setState(() => _sending.add(reminderId));
    final ok = await widget.api.adminSendReminder(
      clubId: widget.clubId,
      role: widget.role,
      reminderId: reminderId,
    );
    if (!mounted) return;
    setState(() => _sending.remove(reminderId));
    widget.onAction(ok ? '발송 기록을 저장했습니다.' : '발송에 실패했습니다.');
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: widget.overview.reminderTargets.map((group) =>
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InfoCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CardHeader(
                  label: group.description,
                  title: '${group.title} · ${group.targetCount}명',
                ),
                if (group.targets.isEmpty)
                  const Text('발송 대상 없음'),
                ...group.targets.map((target) =>
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          target.memberName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          '${target.phoneNumber} · ${target.reason}',
                          style: TextStyle(color: textBlackSoft, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: (group.targetCount == 0 || _sending.contains(group.id))
                      ? null
                      : () => _sendReminder(group.id),
                  child: const Text('발송 기록'),
                ),
              ],
            ),
          ),
        ),
      ).toList(),
    );
  }
}

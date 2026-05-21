import 'package:flutter/material.dart';

const canvas = Color(0xFFF2F0EB);
const white = Color(0xFFFFFFFF);
const textBlack = Color(0xDE000000);
const textBlackSoft = Color(0x94000000);
const starbucksGreen = Color(0xFF006241);
const greenAccent = Color(0xFF00754A);
const houseGreen = Color(0xFF1E3932);
const greenLight = Color(0xFFD4E9E2);
const gold = Color(0xFFCBA258);
const red = Color(0xFFC82014);

class TextInput extends StatelessWidget {
  const TextInput({
    super.key,
    required this.controller,
    required this.label,
    this.keyboardType,
  });

  final TextEditingController controller;
  final String label;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          border: const OutlineInputBorder(),
          labelText: label,
        ),
      ),
    );
  }
}

class PageScaffold extends StatelessWidget {
  const PageScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: starbucksGreen,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(color: textBlackSoft),
        ),
        const SizedBox(height: 20),
        ...children.expand((child) => [child, const SizedBox(height: 12)]),
      ],
    );
  }
}

class SummaryCard extends StatelessWidget {
  const SummaryCard({
    super.key,
    required this.label,
    required this.title,
    required this.body,
  });

  final String label;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return InfoCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context)
                .textTheme
                .labelSmall
                ?.copyWith(color: textBlackSoft),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: houseGreen,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(body),
        ],
      ),
    );
  }
}

class InfoCard extends StatelessWidget {
  const InfoCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Color(0x24000000), blurRadius: 0.5),
          BoxShadow(
            color: Color(0x3D000000),
            blurRadius: 1,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: child,
    );
  }
}

class CardHeader extends StatelessWidget {
  const CardHeader({super.key, required this.label, required this.title});

  final String label;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context)
              .textTheme
              .labelSmall
              ?.copyWith(color: textBlackSoft),
        ),
        const SizedBox(height: 8),
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: houseGreen,
                fontWeight: FontWeight.w700,
              ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class InfoChip extends StatelessWidget {
  const InfoChip({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: greenLight,
        borderRadius: BorderRadius.circular(50),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          label,
          style: const TextStyle(
            color: houseGreen,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class StatusPill extends StatelessWidget {
  const StatusPill({super.key, required this.label, required this.status});

  final String label;
  final String status;

  @override
  Widget build(BuildContext context) {
    final color = status == 'paid'
        ? greenLight
        : status == 'exempt'
            ? const Color(0xFFEDEBE9)
            : const Color(0xFFFAF6EE);
    final textColor = status == 'paid'
        ? houseGreen
        : status == 'exempt'
            ? textBlackSoft
            : gold;

    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(50),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          child: Text(
            label,
            style: TextStyle(color: textColor, fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }
}

String formatDate(String value) {
  return value.length >= 16
      ? value.substring(5, 16).replaceFirst('T', ' ')
      : value;
}

String formatCurrency(int value) {
  final text = value.toString();
  final buffer = StringBuffer();

  for (var i = 0; i < text.length; i += 1) {
    final remaining = text.length - i;
    buffer.write(text[i]);
    if (remaining > 1 && remaining % 3 == 1) {
      buffer.write(',');
    }
  }

  return buffer.toString();
}

String feeLabel(String status) {
  return switch (status) {
    'paid' => '납부',
    'exempt' => '면제',
    _ => '미납',
  };
}

String attendanceLabel(String status) {
  return switch (status) {
    'present' => '출석',
    'late' => '지각',
    _ => '결석',
  };
}

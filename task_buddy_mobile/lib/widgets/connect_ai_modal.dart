import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import 'neumorphic_card.dart';

class ConnectAiModal extends StatefulWidget {
  const ConnectAiModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const ConnectAiModal(),
    );
  }

  @override
  State<ConnectAiModal> createState() => _ConnectAiModalState();
}

class _ConnectAiModalState extends State<ConnectAiModal> {
  String? _copiedLabel;

  static const String mcpUrl = 'https://todo.theorave.in/api/mcp';
  static const String openApiUrl = 'https://todo.theorave.in/openapi.json';
  static const String publicDocsUrl = 'https://todo.theorave.in/connect-ai';

  static const String claudeConfig = '''{
  "mcpServers": {
    "task-buddy": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "$mcpUrl"]
    }
  }
}''';

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() {
      _copiedLabel = label;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied $label to clipboard!'),
        backgroundColor: AppTheme.primaryColor,
        duration: const Duration(seconds: 2),
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _copiedLabel = null;
        });
      }
    });
  }

  Future<void> _openWebDocs() async {
    final uri = Uri.parse(publicDocsUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.backgroundColorLight,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFA3B1C6),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.backgroundColorLight,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: AppTheme.raisedSmShadow(),
                  ),
                  child: const Icon(Icons.smart_toy_rounded, color: AppTheme.primaryColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Connect AI',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimaryLight,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Claude MCP Priority',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Control Task Buddy using natural language from Claude, ChatGPT, Cursor, and more.',
                        style: TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppTheme.textSecondaryLight),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Endpoint 1: MCP Server URL
            NeumorphicCard(
              isSunken: true,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'REMOTE MCP SERVER ENDPOINT',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textSecondaryLight,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SelectableText(
                    mcpUrl,
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: NeumorphicButton(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      onTap: () => _copyToClipboard(mcpUrl, 'MCP URL'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _copiedLabel == 'MCP URL' ? Icons.check : Icons.copy,
                            size: 14,
                            color: _copiedLabel == 'MCP URL' ? Colors.green : AppTheme.primaryColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _copiedLabel == 'MCP URL' ? 'Copied!' : 'Copy MCP URL',
                            style: const TextStyle(fontSize: 11, color: AppTheme.primaryColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Priority Guide: Claude MCP
            NeumorphicCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.auto_awesome, color: AppTheme.primaryColor, size: 18),
                      SizedBox(width: 6),
                      Text(
                        '1. Claude.ai & Claude Desktop (Recommended)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimaryLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Add Task Buddy to Claude.ai (Settings -> Integrations -> Add MCP Server) or use claude_desktop_config.json:',
                    style: TextStyle(fontSize: 11, color: AppTheme.textSecondaryLight),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      claudeConfig,
                      style: TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 11,
                        color: Color(0xFF34D399),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerRight,
                    child: NeumorphicButton(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      onTap: () => _copyToClipboard(claudeConfig, 'Claude Config'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _copiedLabel == 'Claude Config' ? Icons.check : Icons.copy,
                            size: 14,
                            color: _copiedLabel == 'Claude Config' ? Colors.green : AppTheme.primaryColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _copiedLabel == 'Claude Config' ? 'Copied!' : 'Copy Claude Config',
                            style: const TextStyle(fontSize: 11, color: AppTheme.primaryColor),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Open Public Web Documentation Button
            SizedBox(
              width: double.infinity,
              child: NeumorphicButton(
                isPrimary: true,
                onTap: _openWebDocs,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.open_in_new, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Open Full Documentation in Browser',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

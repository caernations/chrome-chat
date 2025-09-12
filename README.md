# AI Chat Assistant - Chrome Extension

A Chrome Extension (MV3) that provides a **floating, always-on-top chat interface** powered by **Fireworks AI** with Llama models. Built with clean architecture principles, TypeScript, and comprehensive testing.

## Features

### 🚀 **Core Functionality**
- **Always-on-top floating chat window** using Document Picture-in-Picture API
- **Real-time streaming responses** from Fireworks AI (Llama 70B Instruct)
- **Persistent chat history** with local storage
- **Secure API key management** via Chrome sync storage
- **Multiple window modes**: Document PiP, Popup fallback

### 🎨 **User Experience**
- **Clean, responsive UI** with dark/light theme support
- **Keyboard shortcuts**: `Ctrl/Cmd+K` (clear), `Escape` (close/stop)
- **Accessibility compliant** with proper ARIA labels and focus management
- **Drag-to-move** floating window with smart positioning
- **Auto-resizing input** with multi-line support

### ⚙️ **Configuration**
- **Comprehensive settings page** for API keys and preferences
- **Model selection**: Llama 3.1 8B, 70B, 405B Instruct variants
- **Generation parameters**: temperature, max tokens
- **Interface preferences**: theme, window mode

### 🏗️ **Architecture**
- **Clean Architecture** with ports & adapters pattern
- **Domain-driven design** with clear separation of concerns
- **Feature-sliced design** for UI components
- **Dependency injection** for testability
- **Type-safe** throughout with strict TypeScript

## Quick Start

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/chrome-chat.git
   cd chrome-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the extension**:
   ```bash
   npm run build
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project directory

### Configuration

1. **Get a Fireworks API key**:
   - Visit [Fireworks AI Dashboard](https://fireworks.ai/account/api-keys)
   - Create a new API key

2. **Configure the extension**:
   - Right-click the extension icon → "Options"
   - Enter your Fireworks API key
   - Adjust settings as needed
   - Click "Save Settings"

3. **Start chatting**:
   - Click the extension icon to open the floating chat
   - Type your message and press Enter
   - Enjoy real-time AI responses!

## Architecture Overview

### Project Structure

```
/src
├── /app                 # Bootstrap & DI container
├── /domain              # Core types, ports, business logic
│   ├── message.ts       # Chat message types
│   ├── ports.ts         # Interface definitions
│   └── errors.ts        # Domain-specific errors
├── /usecases            # Pure business logic
│   ├── send-message.ts  # Message sending workflow
│   ├── stop-stream.ts   # Stream control
│   └── manage-history.ts # History operations
├── /adapters            # External integrations
│   ├── /fireworks       # Fireworks AI HTTP client
│   ├── /storage         # Chrome storage wrappers
│   └── /runtime         # Chrome runtime messaging
├── /features/chat       # Chat feature implementation
│   ├── /components      # UI components
│   ├── /state           # State management
│   └── /services        # Feature orchestrators
├── /platform            # Platform-specific entry points
│   ├── background.ts    # Service worker
│   ├── popup.ts         # Popup window
│   ├── pip.ts          # Picture-in-Picture
│   └── options.ts      # Settings page
└── /shared              # Shared utilities
    ├── /types          # Zod schemas & validation
    ├── /utils          # Helper functions
    └── /logger         # Structured logging
```

### Design Principles

1. **Ports & Adapters**: Domain logic isolated from external dependencies
2. **Dependency Injection**: Lightweight DI for easy testing and swapping implementations  
3. **Event-Driven State**: Reactive state management with clear event flow
4. **Type Safety**: Comprehensive TypeScript with strict mode and Zod validation
5. **Error Handling**: Structured error types with graceful degradation

## Development

### Available Scripts

```bash
# Development
npm run build          # Compile TypeScript
npm run watch          # Watch mode compilation
npm run lint           # ESLint + type checking
npm run format         # Prettier formatting

# Testing  
npm run test           # Run unit tests
npm run test:watch     # Watch mode testing
npm run e2e            # End-to-end tests
npm run typecheck      # Type checking only

# Build
npm run build          # Production build
```

### Testing Strategy

- **Unit Tests**: Core business logic, adapters, utilities
- **Component Tests**: UI components with mocked dependencies
- **Integration Tests**: Cross-layer interactions
- **E2E Tests**: Full user workflows with Playwright

### Code Quality Tools

- **TypeScript**: Strict mode with comprehensive type coverage
- **ESLint**: TypeScript, import, and promise rules
- **Prettier**: Consistent code formatting
- **Vitest**: Fast unit testing with JSdom
- **Playwright**: Reliable E2E testing

## Usage Guide

### Basic Chat Operations

```typescript
// Send a message
await chatService.sendMessage("Explain quantum computing");

// Stop generation
await chatService.stopStream();

// Clear history  
await chatService.clearHistory();
```

### Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line in message
- **Ctrl/Cmd+K**: Clear chat history
- **Escape**: Close floating window or stop generation

### Window Modes

1. **Document Picture-in-Picture** (Recommended):
   - Always stays on top
   - Drag to reposition
   - Survives tab changes

2. **Popup Window** (Fallback):
   - Standard browser popup
   - Focus management
   - Automatic positioning

## API Reference

### Configuration Schema

```typescript
interface Config {
  fireworksApiKey: string;
  modelId: string; // Default: llama-v3p1-70b-instruct
  temperature: number; // 0-2, default: 0.7
  maxTokens: number; // 256-8192, default: 2048
  windowMode: 'doc-pip' | 'popup'; // default: doc-pip
  theme: 'light' | 'dark' | 'auto'; // default: auto
}
```

### Available Models

- `accounts/fireworks/models/llama-v3p1-8b-instruct` - Fast, efficient
- `accounts/fireworks/models/llama-v3p1-70b-instruct` - Balanced (default)
- `accounts/fireworks/models/llama-v3p1-405b-instruct` - Highest quality

### Message Format

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

## Troubleshooting

### Common Issues

**Extension won't load**:
- Ensure you've run `npm run build`
- Check for TypeScript compilation errors
- Verify manifest.json is valid

**API key issues**:
- Verify key format starts with `fw_`
- Check API key has sufficient credits
- Ensure network connectivity

**Floating window not appearing**:
- Check if Document PiP is supported (Chrome 116+)
- Extension will fallback to popup mode
- Verify popup blockers aren't interfering

**Streaming stops unexpectedly**:
- Check browser console for errors
- Verify API quota and rate limits
- Network connectivity issues may cause interruption

### Debug Mode

Enable debug logging by opening DevTools and setting:
```javascript
localStorage.setItem('ai-chat-debug', 'true');
```

### Performance Optimization

- **Message history** is automatically limited to 100 messages
- **Local storage** is used for chat history (sync for settings)
- **Streaming** minimizes memory usage for long responses
- **Lazy loading** for UI components

## Contributing

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes and add tests
5. Run tests: `npm run test && npm run e2e`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push and create a Pull Request

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Testing Requirements

- All new features must include unit tests
- Critical user paths require E2E tests
- Maintain >90% test coverage
- All tests must pass in CI

## Security Considerations

### API Key Protection
- Keys stored in `chrome.storage.sync` (encrypted by Chrome)
- Never logged or exposed in error messages
- Input masking in settings UI

### Content Security Policy
- Strict CSP prevents XSS attacks
- No inline scripts or external resources
- All network requests to Fireworks API only

### Permissions
- Minimal required permissions
- `activeTab` for UI interaction only
- `storage` for settings and history
- Host permissions limited to Fireworks API

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0 (Initial Release)
- ✅ Document Picture-in-Picture floating chat
- ✅ Fireworks AI integration with streaming
- ✅ Comprehensive settings and configuration
- ✅ Dark/light theme support
- ✅ Persistent chat history
- ✅ Clean architecture with full TypeScript
- ✅ Complete test coverage
- ✅ Accessibility compliance

## Roadmap

- [ ] Multiple chat sessions/tabs
- [ ] Message search and filtering
- [ ] Export chat history
- [ ] Custom system prompts
- [ ] OpenAI API adapter
- [ ] Voice input support
- [ ] Rich text formatting

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chrome-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chrome-chat/discussions)
- **Documentation**: This README and inline code comments
- **API Documentation**: [Fireworks AI Docs](https://docs.fireworks.ai/)

---

**Built with ❤️ using TypeScript, Chrome Extensions MV3, and Fireworks AI**
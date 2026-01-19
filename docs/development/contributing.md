# Contributing to OpenPeople.ai

Thank you for your interest in contributing to OpenPeople.ai! This document outlines the process for contributing to our open-source platform.

## 🎯 Ways to Contribute

### Code Contributions
- **Bug Fixes**: Fix issues in our [issue tracker](../../issues)
- **Features**: Implement new features from our [roadmap](../features/README.md)
- **Enhancements**: Improve existing functionality
- **Documentation**: Improve docs, add examples, fix typos

### Non-Code Contributions
- **Bug Reports**: Report issues with detailed reproduction steps
- **Feature Requests**: Suggest new features or improvements
- **Documentation**: Write guides, tutorials, or API documentation
- **Testing**: Write tests or help with QA
- **Design**: UI/UX improvements and design system contributions
- **Community**: Help answer questions in discussions

## 🚀 Getting Started

### 1. Find an Issue
- Check our [GitHub Issues](../../issues) for good first issues
- Look for issues labeled `good-first-issue` or `help-wanted`
- Comment on the issue to indicate you're working on it

### 2. Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/open_people.git
cd open_people

# Add upstream remote
git remote add upstream https://github.com/OpenPeopleStudio/open_people.git
```

### 3. Set Up Development Environment
Follow our [development setup guide](./setup.md) to get your local environment running.

### 4. Create a Branch
```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or fix a bug
git checkout -b fix/issue-number-description
```

## 📝 Development Process

### Code Standards

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write JSDoc comments for public APIs

#### React Components
```typescript
// Good: Clear component with TypeScript
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function UserProfile({ user, onUpdate }: UserProfileProps) {
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <button onClick={() => onUpdate(user)}>Update</button>
    </div>
  );
}
```

#### Database Changes
- Use Supabase migrations for schema changes
- Follow naming conventions in existing migrations
- Test migrations on a fresh database

#### API Design
- Follow RESTful conventions
- Use consistent error response formats
- Include comprehensive TypeScript types
- Document all endpoints

### Testing Requirements

#### Unit Tests
- Write tests for all new functions and components
- Aim for 80%+ code coverage
- Use descriptive test names

```typescript
describe('UserProfile', () => {
  it('displays user name correctly', () => {
    const user = { name: 'John Doe' };
    render(<UserProfile user={user} onUpdate={jest.fn()} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

#### Integration Tests
- Test component interactions
- Test API endpoints
- Test database operations

#### End-to-End Tests
- Test complete user workflows
- Use Playwright for browser automation
- Test critical paths like signup and login

### Commit Guidelines

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

#### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```bash
feat(auth): add OAuth2 login support

- Implement Google OAuth2 flow
- Add user profile sync
- Update login UI components

Closes #123
```

```bash
fix(api): handle null user in profile endpoint

The profile endpoint crashed when user was null.
Added null check and proper error response.
```

### Pull Request Process

#### Before Submitting
1. **Update your branch**: `git pull upstream main`
2. **Run tests**: `npm run test`
3. **Run linting**: `npm run lint`
4. **Check types**: `npm run type-check`
5. **Build successfully**: `npm run build`

#### Creating a Pull Request
1. **Push your branch**: `git push origin feature/your-feature`
2. **Create PR on GitHub**: Go to your fork and click "New pull request"
3. **Fill out the template**:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Screenshots for UI changes
   - Link to related issues
4. **Request review**: Add appropriate reviewers

#### PR Template
```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
<!-- If applicable, add screenshots -->

## Related Issues
Closes #123
```

## 🔍 Code Review Process

### Reviewers Will Check
- ✅ **Functionality**: Does the code work as intended?
- ✅ **Code Quality**: Is the code clean, readable, and well-structured?
- ✅ **Testing**: Are there adequate tests?
- ✅ **Documentation**: Is documentation updated?
- ✅ **Performance**: Does it impact performance negatively?
- ✅ **Security**: Are there any security concerns?

### Review Comments
- **Request Changes**: Clear explanation of required changes
- **Approve**: Code is ready to merge
- **Comment**: Suggestions for improvement (non-blocking)

### After Approval
- **Squash and merge** for clean commit history
- **Delete branch** after merge
- **Update issues** and close related tickets

## 🐛 Reporting Issues

### Bug Reports
When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce**:
   ```markdown
   1. Go to '...'
   2. Click on '...'
   3. See error
   ```
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**:
   - Browser: Chrome 120.0
   - OS: macOS 14.0
   - Node version: 18.17.0
6. **Screenshots** or **console errors**
7. **Additional context**

### Feature Requests
For new features, please include:

1. **Clear title** for the feature
2. **Problem description**: What's the problem this solves?
3. **Proposed solution**: How should it work?
4. **Alternatives considered**: Other approaches?
5. **Additional context**: Screenshots, mockups, etc.

## 📚 Documentation Contributions

### Improving Documentation
- Fix typos and grammar
- Add missing information
- Improve examples and code snippets
- Update outdated information
- Translate to other languages

### Writing New Documentation
- Follow the [documentation template](../templates/README.md)
- Use clear, concise language
- Include practical examples
- Keep information up-to-date

## 🎨 Design Contributions

### UI/UX Guidelines
- Follow our design system
- Maintain consistency with existing patterns
- Consider accessibility (WCAG 2.1 AA)
- Test on multiple screen sizes
- Support both light and dark themes

### Design System
- Use established components from our design system
- Follow spacing, typography, and color guidelines
- Test component variations
- Document new components

## 🌍 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow
- Report unacceptable behavior

### Communication
- Use GitHub Issues for bugs and features
- Use GitHub Discussions for questions and ideas
- Join our [Discord community](https://discord.gg/openpeople) for real-time chat
- Be patient and helpful when answering questions

## 🏆 Recognition

### Contributors
- All contributors are listed in [CONTRIBUTORS.md](../../CONTRIBUTORS.md)
- Significant contributions may earn "Contributor" status
- Top contributors may be invited to join the core team

### Rewards
- **Hacktoberfest**: Participate in our Hacktoberfest events
- **Bounties**: Special issues may have bounties attached
- **Swag**: Contributors may receive OpenPeople.ai swag

## 📞 Getting Help

### Support Channels
- **📖 Documentation**: Check this guide and [docs](../README.md)
- **💬 Discussions**: [GitHub Discussions](../../discussions)
- **🐛 Issues**: [GitHub Issues](../../issues)
- **💬 Discord**: [Developer Community](https://discord.gg/openpeople)
- **📧 Email**: [contributors@openpeople.ai](mailto:contributors@openpeople.ai)

### Office Hours
- **Weekly**: Thursdays 2-3 PM PST
- **Discord**: `#office-hours` channel
- **Calendar**: [OpenPeople Office Hours](https://calendly.com/openpeople/office-hours)

---

**Thank you for contributing to OpenPeople.ai!** 🚀

Your contributions help make AI safer and more accessible for everyone.

*Last updated: January 18, 2026*
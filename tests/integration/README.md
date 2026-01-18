# Integration Tests for Training Tables RLS Policies

This directory contains comprehensive integration tests for the Row Level Security (RLS) policies on the training infrastructure tables in Supabase.

## Overview

The tests validate that RLS policies correctly enforce data isolation at the database level, ensuring users can only access their own data.

## Tables Tested

- **datasets** - Training datasets with file uploads
- **dataset_images** - Images within datasets (RLS inherited from parent dataset)
- **training_jobs** - Training job configurations and status
- **trained_models** - Completed trained models and metadata

## Test Coverage

### Core RLS Policies

1. **Datasets RLS Policy**
   - User A can create and read their own datasets
   - User A cannot read User B's datasets
   - User A can update/delete their own datasets
   - User A cannot update/delete User B's datasets

2. **Dataset Images RLS Policy** (inherited from parent dataset)
   - User A can add images to their own datasets
   - User A cannot add images to User B's datasets
   - User A cannot read images from User B's datasets
   - Cascading delete: deleting dataset deletes all images

3. **Training Jobs RLS Policy**
   - User A can create training jobs for their own datasets
   - User A can read/update/delete their own training jobs
   - User A cannot access User B's training jobs
   - Training job must link to own dataset

4. **Trained Models RLS Policy**
   - User A can create and manage trained models
   - User A cannot access User B's trained models
   - Cascading delete: deleting job sets trained_model.training_job_id to NULL

5. **Anonymous Access Prevention**
   - Anonymous users cannot read/write any training tables
   - Auth context is properly required

### Security Edge Cases

- Subquery bypass attempts
- Auth.uid() context verification
- Non-existent foreign key references
- Complex cascading delete scenarios

## Running the Tests

### Prerequisites

1. Supabase local instance running on port 55321
2. Training schema migrations applied
3. Test users created (or auto-created during test setup)

### Environment Setup

Create a `.env.local` file with:

```env
SUPABASE_URL=http://127.0.0.1:55321
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### Running Tests

```bash
# Run all integration tests
npm test tests/integration/training-rls.test.ts

# Run with UI
npm run test:ui tests/integration/training-rls.test.ts

# Run specific test suite
npm test tests/integration/training-rls.test.ts --grep "Datasets RLS Policy"

# View test report
npm run test:report
```

## Test Architecture

### User Context Simulation

Tests use mock JWT tokens to simulate different user sessions. The `createUserClient()` function creates a Supabase client with a specific user's auth context:

```typescript
const userAClient = createUserClient(TEST_USER_A_ID);
const userBClient = createUserClient(TEST_USER_B_ID);
```

This allows testing RLS policies without real authentication infrastructure.

### Setup and Teardown

- **beforeAll**: Creates test users (User A and User B)
- **afterAll**: Deletes all test data to ensure clean state

## Security Findings

### Confirmed Secure

✅ All CRUD operations properly restricted by user_id
✅ Anonymous access correctly blocked
✅ Dataset image RLS inherited correctly from parent
✅ Cascading deletes respect RLS constraints
✅ Auth context properly enforced in policies

### Potential Security Gaps

None identified in standard use cases. The RLS policies follow security best practices:

- All tables use `auth.uid() = user_id` checks
- Dataset images inherit parent security via EXISTS subquery
- Foreign keys don't bypass RLS restrictions
- Cascading deletes preserve data isolation

## Performance Considerations

Tests use the admin client for cleanup operations to bypass RLS. In production:

- Each RLS check adds ~1-2ms per query
- Indexes on user_id columns minimize overhead
- Consider denormalizing frequently joined data

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

1. All tests are parallelizable
2. Tests clean up after themselves
3. No external dependencies required
4. Deterministic test data (uses fixed test UUIDs)
5. Can run against ephemeral Supabase instances

### GitHub Actions Example

```yaml
- name: Run RLS Integration Tests
  run: npm test tests/integration/training-rls.test.ts
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Maintenance

When updating RLS policies:

1. Run full test suite to verify no regressions
2. Add new test cases for new policies
3. Update this README with changes
4. Ensure CI/CD passes before merging

## Troubleshooting

### Tests fail with "Supabase not configured"

Ensure environment variables are set:

```bash
export SUPABASE_URL=http://127.0.0.1:55321
export SUPABASE_SERVICE_ROLE_KEY=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Tests fail with "auth.uid() not available"

Ensure `createUserClient()` is being used, not the default anonymous client.

### Cascading delete tests fail

Check that CASCADE/SET NULL constraints are properly defined:

```sql
-- Should use ON DELETE CASCADE or ON DELETE SET NULL
dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE
```

### Performance: Tests running slow

- Reduce parallel test workers if hitting database connection limits
- Ensure Supabase local instance has adequate resources
- Check database indexes with `EXPLAIN ANALYZE`

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Training Schema Migration](../../supabase/migrations/20260118000000_training_schema.sql)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)

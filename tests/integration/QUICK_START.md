# Quick Start Guide - Training RLS Tests

Get the RLS integration tests running in 5 minutes.

## Prerequisites

1. **Supabase Local Stack Running**

   ```bash
   supabase start
   ```

   You should see:

   ```
   Supabase local development setup is complete.

   API URL: http://127.0.0.1:55321
   ```

2. **Database Migrations Applied**

   ```bash
   supabase db push
   ```

   This applies all migrations including the training schema.

3. **Environment Variables Set**
   ```bash
   cp .env.example .env.local
   ```
   Verify these values in `.env.local`:
   ```env
   SUPABASE_URL=http://127.0.0.1:55321
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
   ```

## Running Tests

### Run All RLS Tests

```bash
npm test tests/integration/training-rls.test.ts
```

### Run Specific Test Suite

```bash
npm test tests/integration/training-rls.test.ts --grep "Datasets RLS Policy"
npm test tests/integration/training-rls.test.ts --grep "Anonymous Access"
npm test tests/integration/training-rls.test.ts --grep "Cascading Delete"
```

### Run with Visual UI

```bash
npm run test:ui tests/integration/training-rls.test.ts
```

### View Test Report

```bash
npm run test:report
```

## What Gets Tested

| Test Suite         | Tests | What It Verifies                                     |
| ------------------ | ----- | ---------------------------------------------------- |
| Datasets RLS       | 7     | User isolation, CRUD operations, cross-user blocking |
| Dataset Images RLS | 5     | Inherited RLS, cascading deletes                     |
| Training Jobs RLS  | 6     | Job creation constraints, access control             |
| Trained Models RLS | 7     | Model management, user isolation                     |
| Anonymous Access   | 5     | Unauthenticated users blocked                        |
| Cascading Deletes  | 1     | Data integrity on delete                             |
| Edge Cases         | 3     | Security boundary verification                       |

**Total: 34 test cases**

## Expected Output

```
✓ [tests/integration/training-rls.test.ts] User A can create their own dataset
✓ [tests/integration/training-rls.test.ts] User A can read their own datasets
✓ [tests/integration/training-rls.test.ts] User A CANNOT read User B datasets
...
34 passed (2.3s)
```

## Troubleshooting

### Issue: "Supabase not configured"

**Symptom:**

```
Supabase not configured - using stub client
```

**Solution:** Ensure Supabase is running and environment variables are set:

```bash
# Check Supabase status
supabase status

# Check environment
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Issue: "Connection refused"

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:55321
```

**Solution:** Start Supabase:

```bash
supabase start
```

### Issue: "Users table doesn't exist"

**Symptom:**

```
relation "public.users" does not exist
```

**Solution:** Apply migrations:

```bash
supabase db push
```

### Issue: "Tests timeout"

**Symptom:**

```
Test timeout after 30000ms
```

**Solutions:**

- Check database performance: `supabase status`
- Increase timeout in `tests/integration/playwright.config.ts`
- Run single test: `npm test tests/integration/training-rls.test.ts --grep "User A can create"`

## Key Test Scenarios

### User Isolation

```typescript
// User A creates dataset
const userAClient = createUserClient(TEST_USER_A_ID);
const { data: datasetA } = await userAClient.from('datasets').insert({...});

// User B cannot read it
const userBClient = createUserClient(TEST_USER_B_ID);
const { data: datasetB } = await userBClient.from('datasets').select('*')
  .eq('id', datasetA.id);
expect(datasetB.length).toBe(0);  // Empty result
```

### Cascading Deletes

```typescript
// Create dataset with images
await userAClient.from('dataset_images').insert({
  dataset_id: datasetId,
  file_path: '/images/1.jpg',
});

// Delete dataset
await userAClient.from('datasets').delete().eq('id', datasetId);

// Images automatically deleted (verified via admin)
const { data } = await adminClient.from('dataset_images').select('*').eq('dataset_id', datasetId);
expect(data.length).toBe(0);
```

### Anonymous Blocking

```typescript
// No auth context
const anonClient = createClient(url, anonKey);
const { data } = await anonClient.from('datasets').select('*');
expect(data.length).toBe(0); // Cannot see anything
```

## Manual Testing

If you want to verify RLS manually:

```bash
# Connect to database
supabase db shell

# List all RLS policies
SELECT * FROM pg_policies WHERE tablename IN
  ('datasets', 'dataset_images', 'training_jobs', 'trained_models');

# Check policy details
SELECT policyname, qual
FROM pg_policies
WHERE tablename = 'datasets';
```

## Next Steps

After tests pass:

1. **Deploy to staging**

   ```bash
   git add tests/integration/training-rls.test.ts
   git commit -m "Add RLS integration tests for training tables"
   git push origin feature/training
   ```

2. **Set up CI/CD** - Add to GitHub Actions:

   ```yaml
   - name: Test RLS Policies
     run: npm test tests/integration/training-rls.test.ts
   ```

3. **Monitor in production** - Query security events:
   ```sql
   SELECT * FROM admin.pg_stat_statements
   WHERE query LIKE '%RLS%'
   LIMIT 10;
   ```

## Performance Benchmarks

Expected test performance:

| Operation          | Typical Time |
| ------------------ | ------------ |
| User create + read | ~50ms        |
| Cascading delete   | ~100ms       |
| Full test suite    | 2-3 seconds  |

If tests are slower, check:

- Database CPU usage: `supabase status`
- Network latency to 127.0.0.1
- Disk I/O on Supabase container

## References

- [Full RLS Testing Guide](./SECURITY_TESTING.md)
- [Integration Tests Documentation](./README.md)
- [Setup Utilities](./setup.ts)

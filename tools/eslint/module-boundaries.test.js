const path = require('node:path');
const { RuleTester } = require('eslint');

const rule = require('./module-boundaries');

const root = path.resolve(__dirname, '../..');
const file = (rel) => path.join(root, rel);
const tester = new RuleTester({ languageOptions: { ecmaVersion: 2022, sourceType: 'module' } });

tester.run('module-boundaries', rule, {
  valid: [
    {
      filename: file('src/modules/accounts/runtime.ts'),
      code: "import { x } from '@/core/contracts/finance';",
    },
    { filename: file('src/modules/accounts/ui/a.tsx'), code: "import { y } from '../runtime';" },
    { filename: file('src/bootstrap/loaders.ts'), code: "const m = require('@/modules/accounts');" },
    {
      filename: file('app/index.tsx'),
      code: "import { ModuleScreen } from '@/core/registry/module-screen';",
    },
    { filename: file('src/core/db/handle.ts'), code: "import { z } from 'zod';" },
  ],
  invalid: [
    {
      filename: file('src/modules/loans/runtime.ts'),
      code: "import { x } from '@/modules/accounts/runtime';",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      filename: file('src/modules/loans/ui/a.tsx'),
      code: "import { x } from '../../accounts';",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      filename: file('src/core/registry/r.ts'),
      code: "import { x } from '@/modules/accounts';",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      filename: file('src/bootstrap/x.ts'),
      code: "const m = require('@/modules/accounts/runtime');",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      filename: file('app/index.tsx'),
      code: "import { x } from '@/modules/dashboard';",
      errors: [{ messageId: 'forbidden' }],
    },
    {
      filename: file('src/config/schema.ts'),
      code: "import { x } from '@/core/units/money';",
      errors: [{ messageId: 'forbidden' }],
    },
  ],
});

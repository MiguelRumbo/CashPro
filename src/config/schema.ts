import { z } from 'zod';

const currencyCodeSchema = z.enum(['MXN', 'USD', 'EUR']);

const moduleToggleSchema = z.object({ enabled: z.boolean() }).strict();

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error']);

const daysListSchema = z.array(z.number().int().min(0)).min(1);

export const appConfigSchema = z
  .object({
    app: z.object({ name: z.string().min(1), locale: z.string().min(2) }).strict(),
    modules: z
      .object({
        dashboard: moduleToggleSchema,
        movements: moduleToggleSchema,
        reports: moduleToggleSchema,
        accounts: moduleToggleSchema,
        budgets: moduleToggleSchema,
        savingsGoals: moduleToggleSchema,
        loans: moduleToggleSchema,
        subscriptions: moduleToggleSchema,
        vehicles: moduleToggleSchema,
        alerts: moduleToggleSchema,
        settings: moduleToggleSchema,
      })
      .strict(),
    db: z.object({ fileName: z.string().regex(/^[\w-]+\.db$/) }).strict(),
    logger: z.object({ devMinLevel: logLevelSchema, prodMinLevel: logLevelSchema }).strict(),
    currency: z
      .object({
        default: currencyCodeSchema,
        formats: z.record(
          currencyCodeSchema,
          z.object({ locale: z.string(), symbol: z.string().min(1) }).strict(),
        ),
        fractionDigits: z.number().int().min(0).max(4),
      })
      .strict(),
    accounts: z
      .object({
        cardLastDigits: z.number().int().min(1).max(8),
      })
      .strict(),
    budgets: z
      .object({
        defaults: z
          .object({
            savingIcon: z.string(),
            savingColor: z.string(),
            expenseIcon: z.string(),
            expenseColor: z.string(),
          })
          .strict(),
      })
      .strict(),
    savingsGoals: z
      .object({
        defaults: z.object({ icon: z.string(), color: z.string() }).strict(),
      })
      .strict(),
    subscriptions: z
      .object({
        monthlyFactor: z
          .object({
            weekly: z.number().positive(),
            biweekly: z.number().positive(),
            monthly: z.number().positive(),
            yearly: z.number().positive(),
          })
          .strict(),
        upcomingWindowDays: z.number().int().positive(),
        defaults: z
          .object({ icon: z.string(), color: z.string(), notifyBeforeDays: z.number().int() })
          .strict(),
      })
      .strict(),
    alerts: z
      .object({
        creditCutoffDaysBefore: daysListSchema,
        creditPaymentDaysBefore: daysListSchema,
        budgetWarningPercent: z.number().positive(),
        budgetExceededPercent: z.number().positive(),
        loanDueWithinDays: z.number().int().min(0),
        subscriptionDueDaysBefore: daysListSchema,
        goalDaysPerMonth: z.number().positive(),
        goalBehindRatio: z.number().positive().max(1),
      })
      .strict()
      .refine((a) => a.budgetWarningPercent < a.budgetExceededPercent, {
        message: 'budgetWarningPercent debe ser menor que budgetExceededPercent',
      }),
    ui: z
      .object({
        splashFadeMs: z.number().int().min(0),
        primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      })
      .strict(),
  })
  .strict()
  .refine((c) => c.currency.formats[c.currency.default] !== undefined, {
    message: 'currency.default debe tener formato definido',
  });

export type AppConfig = z.infer<typeof appConfigSchema>;
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type ModuleId = keyof AppConfig['modules'];

type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export type FrozenAppConfig = DeepReadonly<AppConfig>;

export function deepFreeze<T>(value: T): DeepReadonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value as DeepReadonly<T>;
}

/** Valida y congela una configuración. Lanza si no cumple el esquema. */
export function buildConfig(raw: unknown): FrozenAppConfig {
  return deepFreeze(appConfigSchema.parse(raw));
}

export const currencyCodes = currencyCodeSchema.options;

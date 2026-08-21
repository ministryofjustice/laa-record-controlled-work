# Forge Domain Structure

We structure our Forge domain, Journeys, Steps, and other Forge components as shown below.

```text
forge/
├─ components/
│  └─ <component>/
│     └─ <component>.ts
├─ effects/
│  └─ <action>.ts
├─ journeys/
│  └─ <journeyGroup>/
│     └─ <journey>/
│        ├─ effects/
│        │  └─ <action>.ts
│        │  steps/
│        │  └─ <step>/
│        │     ├─ <step>.step.ts
│        │     ├─ <step>.blocks.ts
│        │     └─ <step>.formatters.ts
│        ├─ <journey>.journey.ts
│        ├─ <journey>.package.ts
│        ├─ <journey>.types.ts
│        └─ <journey>.effects.ts
├─ AnswerKey.enum.ts
├─ DataKey.enum.ts
├─ JourneyCode.enum.ts
└─ StepCode.enum.ts
```

This directory structure uses the following concepts:

- `<component>` - An HTML component, used in Forge blocks.
- `<action>` - A Forge Effect, named for the action it performs.
- `<journeyGroup>` - A group of Forge Journeys, with shared code (steps, effects, etc.). Grouping Journey’s is optional.
- `<journey>` - A single Forge Journey, which may or may not be within a group.
- `<step>` - A single Forge Step, scoped to directory level - e.g. Forge, a Journey group, or an individual Journey.

## General Best Practice

- Use camelCase as a default for naming conventions.
- Exception is URLs, which should use kebab-case.

### Export functions, not objects

- More adaptable for refactoring.
- Consistent pattern of usage.
- Easier to write readable code in a function than an object—e.g. match().branch() with long translation paths can be split out to several blocks/variables for readability.

- Avoid magic strings—use either module scoped const if reused in file only, or enum if used in multiple files.

## Forge

### Answers Enum

Definitive list of Forge Answer keys, across all Journeys.

```ts
export enum AnswerKey {
  ANSWER_KEY = "answerKey",
}
```

### Data Enum

Definitive list of Forge Data keys, across all Journeys.

```ts
export enum DataKey {
  DATA_KEY = "dataKey"
}
```

### Journey Code Enum

Definitive list of Forge Journey codes.

```ts
export enum JourneyCode {
  JOURNEY_NAME = "journeyCode"
}
```

### Step Code Enum

Definitive list of Forge Step codes, across all Journeys.

```ts
export enum StepCode {
  STEP_NAME = "stepCode"
}
```

## Journeys

### Example of a good types file

- Contains only types used broadly across the journey—types used in only one place should be defined at their point of use and not exported.
- Define Forge context shape.

```ts
export interface interface MyJourneyDeps {
  httpClient: HttpClient;
}

export interface MyJourneyData extends Record<string, unknown> {
  [DataKey.DATA_KEY]: MyType;
  [DataKey.DATA_KEY2]: MyOtherType[];
}

export interface MyJourneyAnswers extends Record<string, unknown> {
  [AnswerKey.ANSWER_KEY]: string;
  [AnswerKey.ANSWER_KEY2]: MyType;
}

export type MyJourneyContext = EffectFunctionContext<
  MyJourneyData,
  MyJourneyAnswers,
  JourneySession // a reusable type set in root journey.types
>;
```

### Example of a good package file

Exports a single named Forge Package using the `<journeyName>Package` naming convention.

```ts
import { createForgePackage } from "@ministryofjustice/hmpps-forge/core/authoring";
import { MyJourneyDeps } from "./myJourney.types.js";
import { myJourneyEffects } from "./myJourney.effects.js";

export const myJourneyPackage = createForgePackage<MyJourneyDeps>({
  journey: [myJourney], // put registry inside an array to allow other registries like transformers etc etc
  functions: myJourneyEffects,
})
```

### Example of a good journey file

- Uses JourneyCode values rather than magic strings.
- Avoids bloat by importing steps.

```ts
import { journey } from "@ministryofjustice/hmpps-forge/core/authoring";

export const myJourney = journey({
  code: JourneyCode.MY_JOURNEY,
  onAccess: [
    access({
      effects: [journeyEffects.myEffect()],
    }),
  ],
  path: "/my-journey",
  steps: [
    myStep(),
  ],
  title: title,
  view: { template: "partials/form-step" },
});
```

### Example of a good effects file

Exports a single object containing registered effects used by the journey.

```ts
import { EffectRegistry } from "@ministryofjustice/hmpps-forge/core/authoring";
import { MyJourneyDeps } from "./myJourney.types.js";
import { myEffect } from "./effects/myEffect.ts";

export const effectRegistry = new EffectRegistry<MyJourneyDeps>();

export const myJourneyEffects = {
  myEffect: effectRegistry.register(myEffect),
};
```

## Steps

### Example of a good step file

```ts
export const myStep = step({
  blocks: [block(), block2()],
  onSubmission: [
    submit({
      onValid: {
        effects: [journeyEffects.myEffect()],
        next: [redirect({ goto: "/somewhereElse" })],
      },
      validate: true,
    }),
  ],
  path: "/",
  title: title,
});
```

### Example of a good blocks file

- Blocks are exported as functions.
- Blocks are documented.
- Block exports use the naming convention `<some>Block`.
- Blocks should be added to root blocks if they are reusable by other journeys and steps

```ts
import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  title,
  labelHint,
  radioInputTitle,
  requiredMessage
} from "#/journeys/myJourney/myJourney.formatters.js";
import { GovUKRadioInput, GovUKRadioInput } from "@ministryofjustice/hmpps-forge/govuk-components";

export const heading = GovUKHeading({
  level: H1,
  text: title,
});

export const label = GovUKBody({
  classes: "govuk-hint",
  text: labelHint,
});

export const myQuestionRadioInput = GovUKRadioInput({
  code: JourneyCode.MY_JOURNEY,
  fieldset: {
    legend: {
      classes: "govuk-fieldset__legend--l",
      isPageHeading: true,
      text: radioInputTitle,
    },
  },
  items: [
    {
      text: yes,
      value: "yes",
    },
    {
      text: no,
      value: "no",
    },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: requiredMessage,
    }),
  ],
});
```

### Example of a good formatters file

Only exports methods that:

- Return strings—either plain text or HTML.
- Format or conditionally return values.
- Exports using the naming convention `format<SomeThing>`.
- Name translated strings for their semantic meaning before conditional use.

```ts
/**
 * Legal Aid Before label block.
 * @returns ResolvableString
 */
export const formatLegalAidBeforeLabel = (): ResolvableString => {
  const same = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
  );
  const different = t(
    "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
  );
  const no = t("common.no");

  return match(Answer(AnswersKey.LEGAL_AID_BEFORE))
    .branch(Condition.Equals("yesSameMatter"), same)
    .branch(Condition.Equals("yesDifferentMatter"), different)
    .otherwise(no);
};
```

## Effects

A good effect file:

- Exports a single named effect per file.
- Exports a Forge effect function—i.e. curried function of (deps) => (context) => {}
- Documents what the effect does.

Example:

```ts
/**
 * Does some work.
 */
export const myEffect = (deps) => (context) => {
  // Do some work
}
```

## Instructions

In RCW we build our single question per page form flows in Forge. To ensure good test coverage, this is a guide to what each step added needs to include in the PR.

### Creating a Step

1. Create the step in `src/journeys/<journeyGroup>/<journey>/steps/<step>/myStep.ts`
2. Add the step to the relevant Journey file in `src/journeys/<journeyGroup>/<journey>/myJourney.journey.ts`
3. Add the step to the UI test located in `tests/ui/tests/journeys/<journey>`. These should cover:
   - The happy path journey renders each step in the correct order
   - Data can be entered as expected in each step
   - The check answers step contains all of the correct information given the journey completed
4. Add integration tests for the step in `tests/integration/journeys/<your journey name>`. These should cover:
   - Correct title is rendered
   - Any question blocks are rendered completely
   - Any validation errors appear as expected
   - Any redirects happen as expected
5. Add unit tests for any new effects that have been created in `tests/unit/src/journeys/<journeyGroup>/<journey>/effects/myEffects.spec.ts`. Each new effect should be tested independently, and these should generally cover:
   - Usage with new data
   - Usage with existing data
   - Usage with data from a different journey

## Related articles

[Forge documentation](https://forge-developer-guide-dev.hmpps.service.justice.gov.uk/forge-developer-guide/get-started/overview)
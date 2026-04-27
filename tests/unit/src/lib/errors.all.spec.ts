import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

// loop through all the exports in lib/errors
// find export entities that extend DomainError
// test that their class names and name properties are matching
describe('Domain Errors >', () => {
  const dir = path.join(__dirname, '../../../src/lib/errors');

  // Get all files, excluding the base class and types
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts') && !f.includes('domainError.ts'));

  files.forEach(file => {
    describe(`${file} >`, () => {
      const modules = require(path.join(dir, file));

      Object.values(modules).forEach((Export: any) => {
        // classes are typed as function in JS
        if (typeof Export !== 'function') return;

        // get export prototype (parent class)
        // loop through prototypes, break at top of JS prototype chain (Function.prototype)
        let prototype = Object.getPrototypeOf(Export);
        while (prototype && prototype !== Function.prototype) {
          // if export prototype (parent class) is DomainError, test it
          if (prototype.name === 'DomainError') {
            it(`${Export.name} class name should match instance property 'name'`, () => {
              const instance = new Export();
              expect(instance.name).to.equal(Export.name);
            });
            break;
          }
          
          // if export is not DomainError, walk up the chain
          prototype = Object.getPrototypeOf(prototype);
        }
      });
    });
  });
});

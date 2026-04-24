import fs from 'fs';
import path from 'path';
import { expect } from 'chai';

describe('Domain Errors >', () => {
  const dir = path.join(__dirname, '../../../src/lib/errors');

  // Get all files, excluding the base class and types
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.ts') && !f.includes('domainError.ts'));

  files.forEach(file => {
    describe(`${file} >`, () => {
      const moduleImports = require(path.join(dir, file));

      Object.values(moduleImports).forEach((ExportedEntity: any) => {
        // classes are typed as function
        if (typeof ExportedEntity !== 'function') return;

        // 2. Walk up the prototype chain safely by string name
        let prototype = Object.getPrototypeOf(ExportedEntity);
        while (prototype && prototype !== Function.prototype) {
          // if the exported entity is a DomainError, test it
          if (prototype.name === 'DomainError') {
            it(`${ExportedEntity.name} class name should match instance property 'name'`, () => {
              const instance = new ExportedEntity();
              expect(instance.name).to.equal(ExportedEntity.name);
            });
            break;
          }
          
          prototype = Object.getPrototypeOf(prototype);
        }
      });
    });
  });
});

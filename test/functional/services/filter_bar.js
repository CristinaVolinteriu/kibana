/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export function FilterBarProvider({ getService }) {
  const remote = getService('remote');
  const testSubjects = getService('testSubjects');
  const find = getService('find');

  async function typeIntoReactSelect(testSubj, value) {
    const select = await testSubjects.find(testSubj);
    const input = await select.findByClassName('ui-select-search');
    await input.type(value);
    const activeSelection = await select.findByClassName('active');
    await activeSelection.click();
  }

  class FilterBar {
    hasFilter(key, value, enabled = true) {
      const filterActivationState = enabled ? 'enabled' : 'disabled';
      return testSubjects.exists(
        `filter & filter-key-${key} & filter-value-${value} & filter-${filterActivationState}`
      );
    }

    async removeFilter(key) {
      const filterElement = await testSubjects.find(`filter & filter-key-${key}`);
      await remote.moveMouseTo(filterElement);
      await testSubjects.click(`filter & filter-key-${key} removeFilter-${key}`);
    }

    async toggleFilterEnabled(key) {
      const filterElement = await testSubjects.find(`filter & filter-key-${key}`);
      await remote.moveMouseTo(filterElement);
      await testSubjects.click(`filter & filter-key-${key} disableFilter-${key}`);
    }

    async addFilter(field, operator, values) {
      if (!Array.isArray(values)) {
        values = [values];
      }
      await testSubjects.click('addFilter');
      await typeIntoReactSelect('filterfieldSuggestionList', field);
      await typeIntoReactSelect('filterOperatorList', operator);
      const params = await testSubjects.find('filterParams');
      const paramFields = await params.findAllByTagName('input');
      await Promise.all(values.map(async (value, index) => {
        await paramFields[index].type(value);
        // Checks if the actual options value has an auto complete (like 'is one of' filter)
        // In this case we need to click the active autocompletion.
        const hasAutocompletion = await find.exists(async () => await params.findByClassName('active'));
        if (hasAutocompletion) {
          const activeSelection = await params.findByClassName('active');
          await activeSelection.click();
        }
      }));
      await testSubjects.click('saveFilter');
    }

    async clickEditFilter(key, value) {
      const pill = await testSubjects.find(`filter & filter-key-${key} & filter-value-${value}`);
      await remote.moveMouseTo(pill);
      await testSubjects.click('editFilter');
    }

    async getFilterEditorPhrases() {
      const spans = await testSubjects.findAll('filterEditorPhrases');
      return await Promise.all(spans.map(el => el.getVisibleText()));
    }

    async ensureFieldEditorModalIsClosed() {
      const closeFilterEditorModalButtonExists = await testSubjects.exists('filterEditorModalCloseButton');
      if (closeFilterEditorModalButtonExists) {
        await testSubjects.click('filterEditorModalCloseButton');
      }
    }

    async getFilterFieldIndexPatterns() {
      const indexPatterns = [];
      const groups = await find.allByCssSelector('.ui-select-choices-group-label');
      for (let i = 0; i < groups.length; i++) {
        indexPatterns.push(await groups[i].getVisibleText());
      }
      return indexPatterns;
    }
  }

  return new FilterBar();
}

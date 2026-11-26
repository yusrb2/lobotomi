import { useState } from 'preact/hooks';
import { TabPanel, Tabs } from '../../components/ui/Tabs';
import { dict } from '../../state/store';
import { BrainDump } from './BrainDump';
import { CalmDotMatrix } from './CalmDotMatrix';
import { StimulationLedger } from './StimulationLedger';

export function LedgerView() {
  const copy = dict.value;
  const [subTab, setSubTab] = useState('ledger');

  return (
    <section className="py-2">
      <Tabs
        value={subTab}
        onValueChange={setSubTab}
        options={[
          { value: 'ledger', label: copy.ledger.tabs.ledger },
          { value: 'dump', label: copy.ledger.tabs.dump },
        ]}
      >
        <TabPanel value="ledger" className="space-y-6">
          <CalmDotMatrix />
          <StimulationLedger />
        </TabPanel>
        <TabPanel value="dump">
          <BrainDump />
        </TabPanel>
      </Tabs>
    </section>
  );
}

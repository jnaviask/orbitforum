const program = require('commander');
import { version } from '../package.json';
import { ForumDatabase } from '../client/scripts/controllers/database';

program.version(version)
  .name('yarn api')
  .usage('[ARGS...]')
  .arguments('[args...]')
  .action(async (args: string[]) => {
    const dummy = () => { return; };
    const forum = new ForumDatabase(true, dummy, dummy, program.address);
    console.log(`forum constructed with address ${forum.getAddress()}`);
    const threads = await forum.initThreads();
    console.log('threads loaded');
    console.log(threads);
  })
  .option('-a, --address <address>', 'The forum address to use. Omit to create new.')
;

program.parse(process.argv);

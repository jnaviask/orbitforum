const program = require('commander');
import { version } from '../package.json';
import { ForumDatabase } from '../client/scripts/controllers/database';

program.version(version)
  .name('yarn api')
  .usage('[ARGS...]')
  .arguments('[args...]')
  .action(async (args: string[]) => {
    if (!program.create_new && !program.address) {
      console.log('Error: must provide either address or create-new flag.');
      process.exit(1);
    }
    const dummy = () => { return; };
    const forum = new ForumDatabase(program.address, dummy, dummy, program.create_new);
    console.log(`forum constructed with address ${forum.getAddress()}`);
    const threads = await forum.loadThreads();
    console.log('threads loaded');
    console.log(threads);
  })
  .option('-c, --create-new', 'Create a new forum address.')
  .option('-a, --address <address>', 'The forum address to use.')
;

program.parse(process.argv);

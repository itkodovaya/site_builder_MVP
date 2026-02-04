/**
 * Main Entry Point
 * Bootstrap the configurator_site service
 */

import { config } from './config';
import { DIContainer } from './container/DIContainer';
import { createFastifyServer } from './infrastructure/http/FastifyServer';

async function bootstrap() {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:11',message:'bootstrap started',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const container = DIContainer.create(config);
  const logger = container.logger;

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:15',message:'container created',data:{hasController:!!container.draftController},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  try {
    logger.info('Starting configurator_site service...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Storage backend: ${config.draft.storageBackend}`);
    logger.info(`Draft TTL: ${config.draft.ttlSeconds}s`);

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:25',message:'before createFastifyServer',data:{host:config.server.host,port:config.server.port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Create HTTP server
    const server = await createFastifyServer(
      {
        host: config.server.host,
        port: config.server.port,
        logger,
        cors: config.server.cors,
        rateLimit: config.server.rateLimit,
      },
      container.draftController
    );

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:35',message:'after createFastifyServer',data:{serverCreated:!!server},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:33',message:'before server.listen',data:{host:config.server.host,port:config.server.port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Start listening
    try {
      // Fastify listen - use port and host as positional arguments for better Windows compatibility
      const address = await server.listen(config.server.port, config.server.host);
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:42',message:'after server.listen success',data:{address:address,serverAddress:server.server.address()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (listenError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:45',message:'server.listen error',data:{code:listenError?.code,message:listenError?.message,errno:listenError?.errno,stack:listenError?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      throw listenError;
    }

    logger.info(`Server listening on http://${config.server.host}:${config.server.port}`);
    logger.info('Service ready to accept requests');
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/1aae84cb-ebba-4fd6-9ef6-7298d29d9e0a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:71',message:'server fully started',data:{host:config.server.host,port:config.server.port},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      try {
        await server.close();
        logger.info('HTTP server closed');
        
        await container.shutdown();
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start service');
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
      console.error('Full error:', error);
    } else {
      logger.error('Unknown error:', error);
      console.error('Full error object:', error);
    }
    await container.shutdown();
    process.exit(1);
  }
}

// Start the service
bootstrap();

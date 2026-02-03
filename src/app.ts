import { Run } from './bot'

async function Initialize(): Promise<void> {
  try {
    RegisterShutdownEvents()
    console.log('Initializing Crypto Clash Bot...')
    await Run()
  } catch (error) {
    console.error('Initialization error:', error)
    throw error
  }
}

function RegisterShutdownEvents(): void {
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception! Shutting down.')
    console.error(error)
    process.exit(1)
  })

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  })

  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Graceful shutdown...')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Graceful shutdown...')
    process.exit(0)
  })
}

Initialize()

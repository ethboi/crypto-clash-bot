import { ChatInputCommandInteraction, Client } from 'discord.js'
import { tournamentReportService } from '../../services/TournamentReportService'
import {
  DailyStandingsEmbed,
  TournamentInfoEmbed,
  TournamentResultsEmbed,
  PrizesEmbed,
  PlayerStatsEmbed,
} from '../../templates/tournamentReport'

export async function handleStandings(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply()

  try {
    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) {
      await interaction.editReply('No active tournament right now.')
      return
    }

    const day = tournamentReportService.getTournamentDay(tournament)
    const leaderboard = await tournamentReportService.getLeaderboard(tournament._id!.toString(), 25)
    const participantCount = await tournamentReportService.getParticipantCount(tournament._id!.toString())

    const embeds = DailyStandingsEmbed(tournament, day, leaderboard, participantCount)
    await interaction.editReply({ embeds })
  } catch (error) {
    console.error('[Tournament] Error handling /standings:', error)
    await interaction.editReply('Failed to fetch standings.')
  }
}

export async function handleTournament(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply()

  try {
    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) {
      // Check upcoming
      const upcoming = await tournamentReportService.getUpcomingTournaments()
      if (upcoming.length > 0) {
        const next = upcoming[0]
        const startTs = Math.floor(new Date(next.startDate).getTime() / 1000)
        await interaction.editReply(`No active tournament. Next: **${next.name}** starts <t:${startTs}:R>`)
      } else {
        await interaction.editReply('No active or upcoming tournaments.')
      }
      return
    }

    const day = tournamentReportService.getTournamentDay(tournament)
    const timeRemaining = tournamentReportService.getTimeRemaining(tournament)
    const participantCount = await tournamentReportService.getParticipantCount(tournament._id!.toString())

    const embed = TournamentInfoEmbed(tournament, day, timeRemaining, participantCount)
    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error('[Tournament] Error handling /tournament:', error)
    await interaction.editReply('Failed to fetch tournament info.')
  }
}

export async function handleResults(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply()

  try {
    // Get most recently finalized tournament
    const finalized = await tournamentReportService.getRecentlyFinalized()
    if (finalized.length === 0) {
      await interaction.editReply('No recently finalized tournaments.')
      return
    }

    const tournament = finalized[0]
    const results = await tournamentReportService.getTournamentResults(tournament._id!.toString(), 50)
    const prizes = tournament.prizes || tournamentReportService.getDefaultPrizes()

    const embeds = TournamentResultsEmbed(tournament, results, prizes)
    await interaction.editReply({ embeds })
  } catch (error) {
    console.error('[Tournament] Error handling /results:', error)
    await interaction.editReply('Failed to fetch results.')
  }
}

export async function handlePrizes(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const tournament = await tournamentReportService.getActiveTournament()
    const prizes = tournament?.prizes || tournamentReportService.getDefaultPrizes()
    const embed = PrizesEmbed(prizes)
    await interaction.reply({ embeds: [embed] })
  } catch (error) {
    console.error('[Tournament] Error handling /prizes:', error)
    await interaction.reply({ content: 'Failed to fetch prizes.', ephemeral: true })
  }
}

export async function handleMyStats(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: true })

  try {
    const wallet = interaction.options.getString('wallet')
    if (!wallet) {
      await interaction.editReply('Please provide a wallet address.')
      return
    }

    const tournament = await tournamentReportService.getActiveTournament()
    if (!tournament) {
      await interaction.editReply('No active tournament.')
      return
    }

    const entry = await tournamentReportService.getPlayerStats(tournament._id!.toString(), wallet)
    if (!entry) {
      await interaction.editReply('Wallet not found in current tournament.')
      return
    }

    const participantCount = await tournamentReportService.getParticipantCount(tournament._id!.toString())
    const embed = PlayerStatsEmbed(entry, tournament.name, participantCount)
    await interaction.editReply({ embeds: [embed] })
  } catch (error) {
    console.error('[Tournament] Error handling /mystats:', error)
    await interaction.editReply('Failed to fetch stats.')
  }
}

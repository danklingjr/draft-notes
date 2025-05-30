import { NFLPlayer } from './nflService';

export function exportRosterToCSV(players: NFLPlayer[]): void {
  // Create CSV content
  const headers = ['Name', 'Position', 'Team', 'Bye Week'];
  const rows = players.map(player => [
    player.fullName,
    player.position,
    player.team,
    player.byeWeek || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `fantasy-roster-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
} 
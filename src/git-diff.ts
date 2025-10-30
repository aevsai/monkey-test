/**
 * Git operations for generating diffs
 */

import { simpleGit, SimpleGit } from 'simple-git';

export interface GitDiffOptions {
  fromCommit: string;
  toCommit?: string; // defaults to HEAD
  maxDiffSize?: number; // max characters in diff
}

export interface GitDiffResult {
  diff: string;
  filesChanged: string[];
  insertions: number;
  deletions: number;
  fromCommit: string;
  toCommit: string;
}

/**
 * Check if current directory is a git repository
 */
export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(cwd);
    await git.status();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validate that a commit reference exists
 */
export async function validateCommitRef(commitRef: string, cwd: string = process.cwd()): Promise<boolean> {
  try {
    const git: SimpleGit = simpleGit(cwd);
    await git.revparse([commitRef]);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the full commit hash from a reference
 */
export async function resolveCommitRef(commitRef: string, cwd: string = process.cwd()): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const hash = await git.revparse([commitRef]);
  return hash.trim();
}

/**
 * Get diff between two commits
 */
export async function getGitDiff(options: GitDiffOptions, cwd: string = process.cwd()): Promise<GitDiffResult> {
  const git: SimpleGit = simpleGit(cwd);
  
  // Validate git repository
  if (!await isGitRepository(cwd)) {
    throw new Error('Not a git repository');
  }

  // Validate commit reference
  if (!await validateCommitRef(options.fromCommit, cwd)) {
    throw new Error(`Invalid commit reference: ${options.fromCommit}`);
  }

  const toCommit = options.toCommit || 'HEAD';
  if (!await validateCommitRef(toCommit, cwd)) {
    throw new Error(`Invalid commit reference: ${toCommit}`);
  }

  // Resolve commit hashes
  const fromHash = await resolveCommitRef(options.fromCommit, cwd);
  const toHash = await resolveCommitRef(toCommit, cwd);

  // Get diff summary for statistics
  const diffSummary = await git.diffSummary([fromHash, toHash]);

  // Get full diff (excluding binary files)
  const diffResult = await git.diff([
    fromHash,
    toHash,
    '--no-color',
    '--no-ext-diff',
    '--unified=3',
    '--',
    ':!*.png',
    ':!*.jpg',
    ':!*.jpeg',
    ':!*.gif',
    ':!*.ico',
    ':!*.pdf',
    ':!*.zip',
    ':!*.tar',
    ':!*.gz',
    ':!*.exe',
    ':!*.dll',
    ':!*.so',
    ':!*.dylib',
  ]);

  let diff = diffResult;

  // Check if diff is empty
  if (!diff || diff.trim().length === 0) {
    throw new Error(`No changes found between ${options.fromCommit} and ${toCommit}`);
  }

  // Truncate if exceeds max size
  const maxSize = options.maxDiffSize || 100000; // 100KB default
  if (diff.length > maxSize) {
    console.warn(`⚠️  Diff size (${diff.length} chars) exceeds max size (${maxSize} chars). Truncating...`);
    diff = diff.substring(0, maxSize) + '\n\n... [diff truncated due to size] ...';
  }

  // Extract list of changed files
  const filesChanged = diffSummary.files.map(f => f.file);

  return {
    diff,
    filesChanged,
    insertions: diffSummary.insertions,
    deletions: diffSummary.deletions,
    fromCommit: fromHash.substring(0, 8),
    toCommit: toHash.substring(0, 8),
  };
}

/**
 * Get current branch name
 */
export async function getCurrentBranch(cwd: string = process.cwd()): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const status = await git.status();
  return status.current || 'unknown';
}

/**
 * Get commit information
 */
export async function getCommitInfo(commitRef: string, cwd: string = process.cwd()): Promise<{
  hash: string;
  author: string;
  date: string;
  message: string;
}> {
  const git: SimpleGit = simpleGit(cwd);
  const log = await git.log([commitRef, '-1']);
  
  if (log.all.length === 0) {
    throw new Error(`Commit not found: ${commitRef}`);
  }

  const commit = log.latest!;
  
  return {
    hash: commit.hash.substring(0, 8),
    author: commit.author_name,
    date: commit.date,
    message: commit.message,
  };
}
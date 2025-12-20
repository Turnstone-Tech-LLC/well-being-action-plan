<script lang="ts">
	import { enhance } from '$app/forms';
	import { generateA11yId } from '$lib/a11y';
	import { toastStore } from '$lib/stores/toast';
	import type { ActionData, PageData } from './$types';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Modal states
	let showInviteModal = $state(false);
	let showEditModal = $state(false);
	let showRemoveModal = $state(false);
	let selectedMember = $state<(typeof data.members)[0] | null>(null);

	// Form states
	let inviteLoading = $state(false);
	let editLoading = $state(false);
	let removeLoading = $state(false);

	// Invite form
	let inviteEmail = $state('');
	let inviteName = $state('');
	let inviteRole = $state<'provider' | 'admin'>('provider');

	// Edit form
	let editName = $state('');
	let editRole = $state<'provider' | 'admin'>('provider');

	// Accessibility IDs
	const inviteEmailId = generateA11yId('invite-email');
	const inviteNameId = generateA11yId('invite-name');
	const inviteRoleId = generateA11yId('invite-role');
	const editNameId = generateA11yId('edit-name');
	const editRoleId = generateA11yId('edit-role');

	// Handle form results
	$effect(() => {
		if (form?.success) {
			if (form.action === 'invite') {
				toastStore.success(form.message || 'Provider added successfully');
				closeInviteModal();
			} else if (form.action === 'update') {
				toastStore.success(form.message || 'Provider updated successfully');
				closeEditModal();
			} else if (form.action === 'remove') {
				toastStore.success(form.message || 'Provider removed successfully');
				closeRemoveModal();
			}
		}
	});

	function openInviteModal() {
		inviteEmail = '';
		inviteName = '';
		inviteRole = 'provider';
		showInviteModal = true;
	}

	function closeInviteModal() {
		showInviteModal = false;
		inviteLoading = false;
	}

	function openEditModal(member: (typeof data.members)[0]) {
		selectedMember = member;
		editName = member.name || '';
		editRole = member.role;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedMember = null;
		editLoading = false;
	}

	function openRemoveModal(member: (typeof data.members)[0]) {
		selectedMember = member;
		showRemoveModal = true;
	}

	function closeRemoveModal() {
		showRemoveModal = false;
		selectedMember = null;
		removeLoading = false;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Team Members | Well-Being Action Plan</title>
	<meta name="description" content="Manage your organization's team members" />
</svelte:head>

<div class="team-page">
	<header class="team-header">
		<div class="header-text">
			<h2>Team Members</h2>
			<p>{data.members.length} {data.members.length === 1 ? 'member' : 'members'}</p>
		</div>
		<button type="button" class="btn btn-primary" onclick={openInviteModal}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<line x1="19" y1="8" x2="19" y2="14" />
				<line x1="22" y1="11" x2="16" y2="11" />
			</svg>
			Add Provider
		</button>
	</header>

	{#if data.members.length === 0}
		<div class="empty-state">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
				<path d="M16 3.13a4 4 0 0 1 0 7.75" />
			</svg>
			<h3>No team members yet</h3>
			<p>Add providers to your organization to collaborate on action plans.</p>
			<button type="button" class="btn btn-primary" onclick={openInviteModal}>
				Add Your First Provider
			</button>
		</div>
	{:else}
		<div class="members-list">
			<div class="list-header">
				<span class="col-name">Name</span>
				<span class="col-role">Role</span>
				<span class="col-joined">Joined</span>
				<span class="col-actions">Actions</span>
			</div>

			{#each data.members as member (member.id)}
				{@const isCurrentUser = member.id === data.currentUserId}
				<div class="member-row" class:current-user={isCurrentUser}>
					<div class="col-name">
						<div class="member-info">
							<span class="member-name">
								{member.name || 'Unnamed Provider'}
								{#if isCurrentUser}
									<span class="you-badge">(you)</span>
								{/if}
							</span>
							<span class="member-email">{member.email}</span>
						</div>
					</div>
					<div class="col-role">
						<span class="role-badge" class:admin={member.role === 'admin'}>
							{member.role === 'admin' ? 'Admin' : 'Provider'}
						</span>
					</div>
					<div class="col-joined">
						{formatDate(member.created_at)}
					</div>
					<div class="col-actions">
						{#if !isCurrentUser}
							<button
								type="button"
								class="action-btn"
								onclick={() => openEditModal(member)}
								aria-label="Edit {member.name || member.email}"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
								</svg>
							</button>
							<button
								type="button"
								class="action-btn action-btn-danger"
								onclick={() => openRemoveModal(member)}
								aria-label="Remove {member.name || member.email}"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<polyline points="3 6 5 6 21 6" />
									<path
										d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
									/>
								</svg>
							</button>
						{:else}
							<span class="actions-disabled">—</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Invite Modal -->
{#if showInviteModal}
	<div
		class="modal-backdrop"
		onclick={closeInviteModal}
		onkeydown={(e) => e.key === 'Escape' && closeInviteModal()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="invite-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="modal-header">
				<h3 id="invite-modal-title">Add Provider</h3>
				<button type="button" class="modal-close" onclick={closeInviteModal} aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			<form
				method="POST"
				action="?/invite"
				use:enhance={() => {
					inviteLoading = true;
					return async ({ update }) => {
						inviteLoading = false;
						await update();
					};
				}}
			>
				{#if form?.action === 'invite' && form?.error}
					<div class="form-error-banner" role="alert">{form.error}</div>
				{/if}

				<div class="modal-body">
					<div class="form-group">
						<label for={inviteEmailId} class="form-label">
							Email <span class="required">*</span>
						</label>
						<input
							type="email"
							id={inviteEmailId}
							name="email"
							bind:value={inviteEmail}
							class="form-input"
							class:error={form?.action === 'invite' && form?.fieldErrors?.email}
							required
							disabled={inviteLoading}
						/>
						{#if form?.action === 'invite' && form?.fieldErrors?.email}
							<span class="field-error">{form.fieldErrors.email}</span>
						{/if}
					</div>

					<div class="form-group">
						<label for={inviteNameId} class="form-label">Name</label>
						<input
							type="text"
							id={inviteNameId}
							name="name"
							bind:value={inviteName}
							class="form-input"
							placeholder="Optional"
							disabled={inviteLoading}
						/>
						<p class="form-help">Provider can set their own name later</p>
					</div>

					<div class="form-group">
						<label for={inviteRoleId} class="form-label">Role</label>
						<select
							id={inviteRoleId}
							name="role"
							bind:value={inviteRole}
							class="form-select"
							disabled={inviteLoading}
						>
							<option value="provider">Provider</option>
							<option value="admin">Admin</option>
						</select>
						<p class="form-help">Admins can manage organization settings and team members</p>
					</div>
				</div>

				<footer class="modal-footer">
					<button
						type="button"
						class="btn btn-outline"
						onclick={closeInviteModal}
						disabled={inviteLoading}
					>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={inviteLoading || !inviteEmail}>
						{#if inviteLoading}
							<span class="spinner" aria-hidden="true"></span>
							Adding...
						{:else}
							Add Provider
						{/if}
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal && selectedMember}
	<div
		class="modal-backdrop"
		onclick={closeEditModal}
		onkeydown={(e) => e.key === 'Escape' && closeEditModal()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-modal-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="modal-header">
				<h3 id="edit-modal-title">Edit Provider</h3>
				<button type="button" class="modal-close" onclick={closeEditModal} aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					editLoading = true;
					return async ({ update }) => {
						editLoading = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="memberId" value={selectedMember.id} />

				{#if form?.action === 'update' && form?.error}
					<div class="form-error-banner" role="alert">{form.error}</div>
				{/if}

				<div class="modal-body">
					<div class="form-group">
						<span class="form-label">Email</span>
						<span class="form-value">{selectedMember.email}</span>
					</div>

					<div class="form-group">
						<label for={editNameId} class="form-label">Name</label>
						<input
							type="text"
							id={editNameId}
							name="name"
							bind:value={editName}
							class="form-input"
							disabled={editLoading}
						/>
					</div>

					<div class="form-group">
						<label for={editRoleId} class="form-label">Role</label>
						<select
							id={editRoleId}
							name="role"
							bind:value={editRole}
							class="form-select"
							disabled={editLoading}
						>
							<option value="provider">Provider</option>
							<option value="admin">Admin</option>
						</select>
						{#if editRole !== selectedMember.role}
							<p class="form-warning">
								{#if editRole === 'admin'}
									This will grant admin privileges to this provider.
								{:else}
									This will remove admin privileges from this provider.
								{/if}
							</p>
						{/if}
					</div>
				</div>

				<footer class="modal-footer">
					<button
						type="button"
						class="btn btn-outline"
						onclick={closeEditModal}
						disabled={editLoading}
					>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={editLoading}>
						{#if editLoading}
							<span class="spinner" aria-hidden="true"></span>
							Saving...
						{:else}
							Save Changes
						{/if}
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<!-- Remove Confirmation Modal -->
{#if showRemoveModal && selectedMember}
	<div
		class="modal-backdrop"
		onclick={closeRemoveModal}
		onkeydown={(e) => e.key === 'Escape' && closeRemoveModal()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="modal modal-danger"
			role="alertdialog"
			aria-modal="true"
			aria-labelledby="remove-modal-title"
			aria-describedby="remove-modal-desc"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<header class="modal-header">
				<h3 id="remove-modal-title">Remove Provider</h3>
				<button type="button" class="modal-close" onclick={closeRemoveModal} aria-label="Close">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			<form
				method="POST"
				action="?/remove"
				use:enhance={() => {
					removeLoading = true;
					return async ({ update }) => {
						removeLoading = false;
						await update();
					};
				}}
			>
				<input type="hidden" name="memberId" value={selectedMember.id} />

				{#if form?.action === 'remove' && form?.error}
					<div class="form-error-banner" role="alert">{form.error}</div>
				{/if}

				<div class="modal-body">
					<p id="remove-modal-desc">
						Are you sure you want to remove <strong
							>{selectedMember.name || selectedMember.email}</strong
						> from the organization?
					</p>
					<p class="warning-text">
						This will revoke their access immediately. Action plans they created will remain.
					</p>
				</div>

				<footer class="modal-footer">
					<button
						type="button"
						class="btn btn-outline"
						onclick={closeRemoveModal}
						disabled={removeLoading}
					>
						Cancel
					</button>
					<button type="submit" class="btn btn-danger" disabled={removeLoading}>
						{#if removeLoading}
							<span class="spinner" aria-hidden="true"></span>
							Removing...
						{:else}
							Remove Provider
						{/if}
					</button>
				</footer>
			</form>
		</div>
	</div>
{/if}

<style>
	.team-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.team-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
	}

	.header-text h2 {
		margin: 0;
		font-size: var(--font-size-xl);
		color: var(--color-gray-900);
	}

	.header-text p {
		margin: var(--space-1) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: var(--space-12) var(--space-6);
		background-color: var(--color-gray-50);
		border: 2px dashed var(--color-gray-200);
		border-radius: var(--radius-lg);
	}

	.empty-state svg {
		color: var(--color-gray-400);
		margin-bottom: var(--space-4);
	}

	.empty-state h3 {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-lg);
		color: var(--color-gray-700);
	}

	.empty-state p {
		margin: 0 0 var(--space-6);
		color: var(--color-text-muted);
	}

	/* Members list */
	.members-list {
		background-color: var(--color-white);
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.list-header {
		display: grid;
		grid-template-columns: 1fr 100px 120px 80px;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		background-color: var(--color-gray-50);
		border-bottom: 1px solid var(--color-gray-200);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.member-row {
		display: grid;
		grid-template-columns: 1fr 100px 120px 80px;
		gap: var(--space-4);
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-gray-100);
		align-items: center;
	}

	.member-row:last-child {
		border-bottom: none;
	}

	.member-row.current-user {
		background-color: #fefce8;
	}

	.member-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.member-name {
		font-weight: 500;
		color: var(--color-text);
	}

	.you-badge {
		color: var(--color-text-muted);
		font-weight: 400;
		font-size: var(--font-size-sm);
	}

	.member-email {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}

	.role-badge {
		display: inline-block;
		padding: var(--space-1) var(--space-2);
		background-color: var(--color-gray-100);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--color-gray-700);
	}

	.role-badge.admin {
		background-color: var(--color-accent);
		color: var(--color-primary);
	}

	.col-joined {
		font-size: var(--font-size-sm);
		color: var(--color-text-muted);
	}

	.col-actions {
		display: flex;
		gap: var(--space-2);
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: 1px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		cursor: pointer;
		color: var(--color-text-muted);
		transition: all 0.15s ease;
	}

	.action-btn:hover {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-300);
		color: var(--color-text);
	}

	.action-btn-danger:hover {
		background-color: #fef2f2;
		border-color: #fecaca;
		color: #dc2626;
	}

	.actions-disabled {
		color: var(--color-gray-300);
		font-size: var(--font-size-sm);
	}

	/* Modal styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: 1000;
	}

	.modal {
		background-color: var(--color-white);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-4) var(--space-6);
		border-bottom: 1px solid var(--color-gray-200);
	}

	.modal-header h3 {
		margin: 0;
		font-size: var(--font-size-lg);
		color: var(--color-gray-900);
	}

	.modal-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.modal-close:hover {
		background-color: var(--color-gray-100);
		color: var(--color-text);
	}

	.modal-body {
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-3);
		padding: var(--space-4) var(--space-6);
		border-top: 1px solid var(--color-gray-200);
		background-color: var(--color-gray-50);
	}

	/* Form styles */
	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.form-label {
		font-weight: 500;
		color: var(--color-text);
		font-size: var(--font-size-sm);
	}

	.required {
		color: #dc2626;
	}

	.form-input,
	.form-select {
		padding: var(--space-3) var(--space-4);
		border: 2px solid var(--color-gray-200);
		border-radius: var(--radius-md);
		font-size: var(--font-size-base);
		font-family: inherit;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(0, 89, 76, 0.1);
	}

	.form-input.error {
		border-color: #dc2626;
	}

	.form-input:disabled,
	.form-select:disabled {
		background-color: var(--color-gray-50);
		cursor: not-allowed;
	}

	.form-value {
		font-size: var(--font-size-base);
		color: var(--color-gray-800);
	}

	.form-help {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.form-warning {
		color: #b45309;
		font-size: var(--font-size-sm);
		margin: 0;
		padding: var(--space-2) var(--space-3);
		background-color: #fef3c7;
		border-radius: var(--radius-md);
	}

	.field-error {
		color: #dc2626;
		font-size: var(--font-size-sm);
	}

	.form-error-banner {
		padding: var(--space-3) var(--space-4);
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius-md);
		color: #991b1b;
		font-size: var(--font-size-sm);
		margin: var(--space-4) var(--space-6) 0;
	}

	.warning-text {
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-5);
		border-radius: var(--radius-md);
		font-weight: 500;
		font-size: var(--font-size-sm);
		text-decoration: none;
		cursor: pointer;
		border: 2px solid transparent;
		transition: all 0.15s ease;
	}

	.btn:focus-visible {
		outline: 3px solid var(--color-accent);
		outline-offset: 2px;
	}

	.btn-primary {
		background-color: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background-color: #004a3f;
		border-color: #004a3f;
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-outline {
		background-color: transparent;
		color: var(--color-gray-700);
		border-color: var(--color-gray-300);
	}

	.btn-outline:hover:not(:disabled) {
		background-color: var(--color-gray-50);
		border-color: var(--color-gray-400);
	}

	.btn-danger {
		background-color: #dc2626;
		color: white;
		border-color: #dc2626;
	}

	.btn-danger:hover:not(:disabled) {
		background-color: #b91c1c;
		border-color: #b91c1c;
	}

	.btn-danger:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Spinner */
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.team-header {
			flex-direction: column;
			align-items: stretch;
		}

		.list-header {
			display: none;
		}

		.member-row {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}

		.col-role,
		.col-joined {
			display: flex;
			align-items: center;
			gap: var(--space-2);
		}

		.col-role::before {
			content: 'Role: ';
			color: var(--color-text-muted);
			font-size: var(--font-size-sm);
		}

		.col-joined::before {
			content: 'Joined: ';
			color: var(--color-text-muted);
		}

		.col-actions {
			justify-content: flex-start;
			padding-top: var(--space-2);
			border-top: 1px solid var(--color-gray-100);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}

		.action-btn,
		.btn {
			transition: none;
		}
	}
</style>

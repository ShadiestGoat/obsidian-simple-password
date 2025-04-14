<script lang="ts">
    let wrongCount = $state(0)

    interface Props {
        correctPassword: string
        hint: string
        value?: string
    }

    let { correctPassword, hint, value = $bindable('') }: Props = $props()

    export function submit(shoulClear: boolean): boolean {
        const correct = value == correctPassword

        if (shoulClear) {
            value = ''
        }

        if (correct) {
            return true
        }

        wrongCount++

        return false
    }
</script>

<div class="sp-password-input">
    <input type="password" placeholder="Password" bind:value />
    {#if wrongCount > 0}
        <p class="sp-wrong">
            Wrong Password!
            {#if wrongCount > 2 && hint}
                Hint: <span class="sp-hint">{hint}</span>
            {/if}
        </p>
    {/if}
</div>

<style>
    .sp-hint {
        font-style: italic;
    }

    .sp-password-input {
        width: 100%;
    }

    input {
        width: 100%;
    }
</style>

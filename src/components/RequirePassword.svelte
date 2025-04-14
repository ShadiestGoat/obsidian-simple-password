<svelte:options runes />

<script lang="ts">
    import PasswordInput from './PasswordInput.svelte'

    interface Props {
        correctPassword: string
        hint: string
        onCorrect?: () => void
    }

    let { correctPassword, hint, onCorrect = () => {} }: Props = $props()

    let passInput: PasswordInput
    let value = $state('')
</script>

<p>This file is protected, please input your password</p>

<form
    class="sp-container"
    onsubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()

        if (passInput.submit(true)) {
            onCorrect()
        }
    }}
>
    <PasswordInput bind:this={passInput} bind:value {correctPassword} {hint} />

    <button type="submit" disabled={value == ''} aria-label="Submit Button" class="mod-cta">
        Ok
    </button>
</form>

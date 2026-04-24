# Thin wrapper around the Anthropic API.
# call_llm(system_prompt, user_prompt) -> str
# Reads ANTHROPIC_API_KEY from the environment — never hardcoded.

import os
import anthropic

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise EnvironmentError("ANTHROPIC_API_KEY environment variable is not set.")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def call_llm(system_prompt: str, user_prompt: str, model: str = "claude-haiku-4-5-20251001") -> str:
    client = _get_client()
    message = client.messages.create(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text

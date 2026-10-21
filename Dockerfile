# Plagx Cite command line in a container.
# A free academic writing utility by Plagiarism Checker X. https://plagiarismcheckerx.com/
#
#   docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-cite check references.bib
FROM node:22-alpine

LABEL org.opencontainers.image.title="Plagx Cite" \
      org.opencontainers.image.description="Format and check references: APA 7 / MLA 9, BibTeX, DOI lookup, duplicate detection. A free academic writing utility by Plagiarism Checker X." \
      org.opencontainers.image.vendor="Plagiarism Checker X" \
      org.opencontainers.image.url="https://plagiarismcheckerx.com/" \
      org.opencontainers.image.source="https://github.com/plagiarismcheckerx/plagx-cite" \
      org.opencontainers.image.documentation="https://github.com/plagiarismcheckerx/plagx-cite#command-line" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app
COPY package.json LICENSE README.md ./
COPY src ./src
COPY bin ./bin

USER node
WORKDIR /data
ENTRYPOINT ["node", "/app/bin/plagx-cite.js"]
CMD ["--help"]

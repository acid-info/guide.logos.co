import * as fs from 'fs'
import * as path from 'path'

// run with:
// ts-node notionExportToDocusaurus.ts

const notionFolder =
  './notionExportedFiles/Logos Brand Guidelines playground 46f95d9b2891477d8ed1cc20cda54459'

interface EntryInfo {
  id: string | null
  name: string
  type: 'file' | 'folder'
  content?: string // only for .md files
  docusaurusPage?: string
  relativePath: string
}

const extractIdFromName = (name: string): string | null => {
  const parts = name.split(' ')
  if (parts.length < 2) return null

  // For folders
  if (!name.includes('.')) return parts[parts.length - 1]

  // For files
  const lastPart = parts[parts.length - 1]
  const fileNameWithoutExtension = lastPart.split('.')[0]

  return fileNameWithoutExtension || null
}

const iterateThroughFolder = (
  folderPath: string,
  relativePath = '',
): EntryInfo[] => {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true })
  const result: EntryInfo[] = []

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name)
    const currentRelativePath = path.join(relativePath, entry.name)
    const id = extractIdFromName(entry.name)

    if (entry.isDirectory()) {
      result.push({
        id,
        name: entry.name,
        type: 'folder',
        relativePath: currentRelativePath,
      })
      result.push(...iterateThroughFolder(fullPath, currentRelativePath))
    } else {
      const entryInfo: EntryInfo = {
        id,
        name: entry.name,
        type: 'file',
        relativePath: currentRelativePath,
      }

      // Check if it's an .md file and if so, get its contents
      if (path.extname(entry.name) === '.md') {
        entryInfo.content = fs.readFileSync(fullPath, 'utf-8')
      }

      if (id) {
        const docusaurusPage = mapNotionIdToDocusaurusPage(id)
        if (docusaurusPage) {
          entryInfo.docusaurusPage = docusaurusPage
        }
      }

      result.push(entryInfo)
    }
  }

  return result
}

const processLinks = (notionContent: string): string => {
  // Replace .csv links with a link to the Notion page.
  const csvLinkReplacer = (match: string, linkText: string, csvId: string) => {
    return `[${linkText}](https://www.notion.so/${csvId})`
  }

  // Replace image paths
  const imageLinkReplacer = (
    match: string,
    altText: string,
    imageName: string,
  ) => {
    return `![${altText}](${imageName.replace('%20', ' ')})`
  }

  // Process the csv links
  notionContent = notionContent.replace(
    /\[([^\]]+?)\]\([^)]+?%20([a-f0-9]{32})\.csv\)/g,
    csvLinkReplacer,
  )

  // Process the image links
  notionContent = notionContent.replace(
    /\!\[(.*?)\]\(.*?(\/[^\/]+?\.(?:png|jpg|jpeg|gif|svg))\)/g,
    imageLinkReplacer,
  )

  return notionContent
}

const updateDocusaurusFileWithNotionContent = (
  docusaurusFilePath: string,
  notionContent: string,
) => {
  // Process the links in the notion file
  const processedContent = processLinks(notionContent)

  // Read the existing Docusaurus file
  const existingContent = fs.readFileSync(docusaurusFilePath, 'utf-8')

  // Extract the header/metadata from the existing docusaurus file
  const headerMatch = existingContent.match(/---[\s\S]+?---/)
  const header = headerMatch ? headerMatch[0] : ''

  // Combine the original docusaurus header + processed notion content.
  const updatedContent = `${header}\n\n${processedContent}`

  // Write back the updated content to the file
  fs.writeFileSync(docusaurusFilePath, updatedContent)
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg']

const moveImagesToStatic = (entry: EntryInfo) => {
  const filePath = path.join(notionFolder, entry.relativePath)

  if (IMAGE_EXTENSIONS.includes(path.extname(entry.name))) {
    const destinationFolder = './static'
    const destinationPath = path.join(
      destinationFolder,
      path.basename(entry.name),
    )

    // Ensure the destination folder exists (in this case just ./static, but this ensures it's created if missing for some reason)
    fs.mkdirSync(destinationFolder, { recursive: true })

    // Check if file already exists. If not, create a copy.
    if (!fs.existsSync(destinationPath)) {
      fs.copyFileSync(filePath, destinationPath)
    }
  }
}

const mapNotionIdToDocusaurusPage = (notionId: string): string | undefined => {
    if (notionId === '419bedb2ead6415aba5ef89ec8899362') {
      return '/philosophy/overview.md'
    }

    if (notionId === 'ce62ed2988cd4293b3f7eb1f49110c67') {
      return '/philosophy/principles.md'
    }

    if (notionId === 'dff0a02ce0d8431d8841e97a975844bb') {
      return 'resources-and-tools/lsd/index.md'
    }

    if (notionId === '31ea305ac88342ebbc505ea93e3bca3a') {
      return 'resources-and-tools/lsd/design-tokens.md'
    }

    if (notionId === 'e5522cb5bfc94082adac41f1ab17a673') {
      return 'resources-and-tools/gallery.md'
    }

    if (notionId === 'c2c250f49ccf47d5835001d407237e8c') {
      return 'resources-and-tools/presentation-kits.md'
    }

    if (notionId === '6c4c002d6ead446cb1f58cbb34a7be4c') {
      return 'visual-language/index.md'
    }

    if (notionId === '8a77263985fa4034bcece99f49850c2c') {
      return 'visual-language/logo.md'
    }

    if (notionId === '11be69519d6649f8a4a10697b503defc') {
      return 'visual-language/typography.md'
    }

    if (notionId === 'c9c45bd6789c41cbbc1c71b296cf68a8') {
      return 'visual-language/color.md'
    }

    if (notionId === '38c306bc2d20470abc12b98b5e90b7b5') {
      return 'visual-language/grid-and-layout.md'
    }

    if (notionId === '066ee8d5fd9f4dec90716560ccfa59ff') {
      return 'voice/index.md'
    }

    if (notionId === 'd074e71c5fd84900a53038757ce78fbb') {
      return 'index.md'
    }
  }

  //
  //// Main script:
;(async () => {
  const entryInfos = iterateThroughFolder(notionFolder)

  // First, move all images to the static folder
  for (const entry of entryInfos) {
    moveImagesToStatic(entry)
  }

  // Now, filter entries that have a corresponding Docusaurus page and update them
  const withDocusaurusPage = entryInfos.filter(entry => entry.docusaurusPage)
  for (const entry of withDocusaurusPage) {
    if (entry.docusaurusPage && entry.content) {
      updateDocusaurusFileWithNotionContent(
        path.join('./docs', entry.docusaurusPage),
        entry.content,
      )
    }
  }
})()
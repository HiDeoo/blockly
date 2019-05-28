/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2014 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Object representing a workspace search.
 * @author hideo.sup@gmail.com
 */
'use strict';

goog.provide('Blockly.Search');


/**
 * Search filters.
 * @type {!Array.<string>}
 * @private
 */
Blockly.Search.FILTERS = [];

/**
 * Searchable blocks.
 * @type {Array.<!Blockly.BlockSvg>}
 * @private
 */
Blockly.Search.BLOCKS = null;

/**
 * Construct the blocks required by the flyout for the search category.
 * @param {!Blockly.Workspace} workspace The workspace containing the search.
 * @return {!Array.<!Element>} Array of XML elements.
 */
Blockly.Search.flyoutCategory = function(workspace) {
  var xmlList = [];

  if (!Blockly.Search.BLOCKS) {
    Blockly.Search.BLOCKS =
      Blockly.Search.getBlocks_(workspace.toolbox_.tree_, workspace);
  }

  if (Blockly.Search.BLOCKS.length === 0) {
    return xmlList;
  }

  if (Blockly.Search.FILTERS.length > 0) {
    for (var i = 0; i < Blockly.Search.BLOCKS.length; i++) {
      var block = Blockly.Search.BLOCKS[i];

      if (block.search(Blockly.Search.FILTERS)) {
        xmlList.push(Blockly.Xml.blockToDom(block));
      }
    }

    if (xmlList.length === 0) {
      var label = goog.dom.createDom('label');
      label.setAttribute('text', Blockly.Msg.SEARCH_NO_RESULT +
        Blockly.Search.FILTERS.join(' ') + '.');
      xmlList.push(label);
    }
  } else {
    var label = goog.dom.createDom('label');
    label.setAttribute('text', Blockly.Msg.SEARCH_NO_FILTER);
    xmlList.push(label);
  }

  return xmlList;
};

/**
 * Dispose of this search and the associated headless blocks.
 */
Blockly.Search.dispose = function() {
  Blockly.Search.FILTERS = null;

  if (Blockly.Search.BLOCKS) {
    for (var i = 0; i < Blockly.Search.BLOCKS.length; i++) {
      Blockly.Search.BLOCKS[i].dispose(false);
    }

    Blockly.Search.BLOCKS = null;
  }
};

/**
 * Get recursively all searchable blocks from a workspace.
 * @param {!Blockly.Toolbox.TreeControl} tree The current tree.
 * @param {!Blockly.Workspace} workspace The workspace.
 * @param {Blockly.Workspace} headlessWorkspace An headless workspace used to
 *     render blocks created automatically if not specified.
 * @return {!Array.<!Blockly.BlockSvg>} Array of headless blocks containing the
 *     searchable blocks.
 * @private
 */
Blockly.Search.getBlocks_ = function(tree, workspace, headlessWorkspace) {
  var blocks = [];

  if (!headlessWorkspace) {
    headlessWorkspace = new Blockly.Workspace();

    blocks = blocks.concat(Blockly.Procedures.flyoutCategory(workspace)
        .map(
            function(block) {
              return Blockly.Xml.domToBlock(block, headlessWorkspace);
            }));

    blocks = blocks.concat(Blockly.Variables.flyoutCategory(workspace)
        .filter(
            function(block) {
              return block.tagName.toUpperCase() === 'BLOCK';
            }).map(function(block) {
          return Blockly.Xml.domToBlock(block, headlessWorkspace);
        }));
  }

  if (!tree.hasChildren()) {
    return blocks;
  }

  var children = tree.getChildren();

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    if (child.blocks && child.blocks.length > 0) {
      for (var j = 0; j < child.blocks.length; j++) {
        var block = child.blocks[j];

        if (typeof block === 'string' ||
          block.tagName.toUpperCase() !== 'BLOCK') {
          continue;
        }

        if (!Blockly.Search.isBlockSearchable(block)) {
          continue;
        } else {
          var atRoot = false;
          var parent = block.parentElement;
          var hierarchyPreventSearch = false;

          while (atRoot !== true && hierarchyPreventSearch !== true) {
            if (parent.tagName.toUpperCase() === 'XML') {
              atRoot = true;
            } else if (!Blockly.Search.isBlockSearchable(parent)) {
              hierarchyPreventSearch = true;
            } else {
              parent = parent.parentElement;
            }
          }
        }

        if (!hierarchyPreventSearch) {
          blocks.push(Blockly.Xml.domToBlock(block, headlessWorkspace));
        }
      }
    }

    blocks = blocks.concat(
        Blockly.Search.getBlocks_(child, workspace, headlessWorkspace)
    );
  }

  return blocks;
};

/**
 * Returns if a block is searchable or not. To not be searchable, the search
 * must have been prevented using the `searchable` attribute in the XML
 * representation.
 * @param  {Block} block The block.
 * @return {boolean} `true` when searchable.
 */
Blockly.Search.isBlockSearchable = function(block) {
  var blockSearchableAttribute = block.getAttribute('searchable');

  if (blockSearchableAttribute === "false") {
    return false;
  }

  return true;
};

/**
 * Set the filters.
 * @param {!string} query Search query.
 */
Blockly.Search.setFilters = function(query) {
  var filterStr = query.trim().toLowerCase();
  Blockly.Search.FILTERS = filterStr.length > 0 ? filterStr.split(' ') : [];
};
